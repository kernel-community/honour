import { createServer } from 'node:http';
import { timingSafeEqual } from 'node:crypto';
import { mkdirSync, statfsSync } from 'node:fs';
import { dirname } from 'node:path';
import { createPublicClient, http, parseAbiItem, type Address } from 'viem';
import { normalize } from 'viem/ens';
import { mainnet, localhost } from 'viem/chains';
import { honourAbi } from '@honour/contracts/abi';
import { address, type HonourEvent } from '@honour/contracts/domain';
import { Store } from './store.ts';

const contract = address(process.env.HONOUR_ADDRESS ?? '');
const start = Number(process.env.DEPLOYMENT_BLOCK);
const chainId = Number(process.env.CHAIN_ID ?? '1');
const token = process.env.INDEXER_TOKEN;
const file = process.env.DB_PATH ?? './honour.sqlite';
if (!token || token.length < 32) throw new Error('INDEXER_TOKEN must be at least 32 characters.');
if (!Number.isSafeInteger(start) || start < 0 || ![1, 31337].includes(chainId)) throw new Error('Set DEPLOYMENT_BLOCK and CHAIN_ID (1 or 31337).');
mkdirSync(dirname(file), { recursive: true });
const store = new Store(file, `${chainId}:${contract.toLowerCase()}:${start}`, start, Number(process.env.DB_MAX_MB ?? 256));
if (process.argv.includes('--rebuild')) { store.rebuild(start); store.close(); console.log('Index cleared. Start the service to rebuild.'); process.exit(0); }
const client = createPublicClient({ chain: chainId === 1 ? mainnet : localhost, transport: http(process.env.GETH_RPC_URL ?? 'http://127.0.0.1:8545', { timeout: 15_000, retryCount: 1 }) });
if (await client.getChainId() !== chainId) throw new Error('Wrong geth chain.');
if (!await client.getCode({ address: contract })) throw new Error('No contract at HONOUR_ADDRESS.');
let lastSync = 0, head = 0, syncing = false, stopped = false;
let syncError: string | null = null;
const events = [
  parseAbiItem('event Proposed(address indexed proposer, address indexed receiver, uint256 proposalId, uint256 amount)'),
  parseAbiItem('event Honoured(address indexed proposer, address indexed receiver, uint256 proposalId, uint256 amount)'),
  parseAbiItem('event Forgiven(address indexed forgiver, address indexed forgiven, uint256 forgivingId, uint256 amount)'),
  parseAbiItem('event Accepted(address indexed forgiver, address indexed forgiven, uint256 forgivingId, uint256 amount)'),
];
async function sync() {
  if (syncing || stopped) return;
  syncing = true;
  try {
    head = Number(await client.getBlockNumber({ cacheTime: 0 }));
    if (head < store.cursor) throw new Error('Chain behind cursor');
    // Bound each tick to keep HTTP reads responsive during a backfill.
    for (let batch = 0; batch < 8 && store.cursor < head; batch++) {
      const disk = statfsSync(dirname(file));
      if (disk.bavail * disk.bsize < 128 * 1024 * 1024) throw new Error('Insufficient disk headroom');
      const end = Math.min(store.cursor + 1000, head);
      const logs = await client.getLogs({ address: contract, events, fromBlock: BigInt(store.cursor + 1), toBlock: BigInt(end), strict: true });
      const timestamps = new Map<number, number>();
      const decoded: HonourEvent[] = [];
      for (const log of logs) {
        const block = Number(log.blockNumber);
        if (!timestamps.has(block)) timestamps.set(block, Number((await client.getBlock({ blockNumber: log.blockNumber })).timestamp));
        const args = log.args;
        decoded.push({ type: log.eventName, from: 'proposer' in args ? args.proposer : args.forgiver,
          to: 'receiver' in args ? args.receiver : args.forgiven,
          offerId: ('proposalId' in args ? args.proposalId : args.forgivingId).toString(), amount: args.amount.toString(),
          block, timestamp: timestamps.get(block)!, hash: log.transactionHash, logIndex: log.logIndex, transactionIndex: log.transactionIndex });
      }
      store.save(decoded, end);
    }
    lastSync = Date.now(); syncError = null;
  } catch { syncError = 'Index updates paused. Check node connectivity and available disk space.'; console.error(syncError); }
  finally { syncing = false; }
}
function authorized(header?: string) {
  const actual = Buffer.from(header ?? ''); const expected = Buffer.from(`Bearer ${token}`);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
const server = createServer(async (req, res) => {
  res.setHeader('content-type', 'application/json'); res.setHeader('cache-control', 'no-store');
  const send = (status: number, data: unknown) => { res.writeHead(status); res.end(JSON.stringify(data)); };
  if (!authorized(req.headers.authorization)) return send(401, { error: 'Unauthorized' });
  if (req.method !== 'GET') return send(405, { error: 'GET only' });
  try {
    const url = new URL(req.url ?? '/', 'http://localhost');
    const status = { chainId, contract, block: store.cursor, head, lastSync, stale: !!syncError || Date.now() - lastSync > 30_000, error: syncError };
    if (url.pathname === '/health') return send(200, status);
    if (url.pathname === '/allowance') {
      const forgiver = address(url.searchParams.get('address') ?? '');
      const recipient = address(url.searchParams.get('forgiveTo') ?? '');
      // Read both constraints from one block, independent of indexed history.
      const blockNumber = await client.getBlockNumber({ cacheTime: 0 });
      const [available, recipientBalance] = await Promise.all([
        client.readContract({ address: contract, abi: honourAbi, functionName: 'forgivenessAvailable', args: [forgiver, recipient], blockNumber }),
        client.readContract({ address: contract, abi: honourAbi, functionName: 'balanceOf', args: [recipient], blockNumber }),
      ]);
      return send(200, { available: available.toString(), recipientBalance: recipientBalance.toString(), block: blockNumber.toString(), status });
    }
    if (url.pathname === '/resolve') {
      const name = url.searchParams.get('name') ?? '';
      if (!name || name.length > 255) return send(400, { error: 'Invalid ENS name' });
      const result = await client.getEnsAddress({ name: normalize(name) });
      return send(200, { address: result });
    }
    if (url.pathname !== '/account') return send(404, { error: 'Not found' });
    const who = address(url.searchParams.get('address') ?? '').toLowerCase() as Address;
    const viewer = url.searchParams.get('viewer') ? address(url.searchParams.get('viewer')!).toLowerCase() : who;
    const page = Number(url.searchParams.get('page') ?? '0');
    if (!Number.isSafeInteger(page) || page < 0 || page > 100_000) return send(400, { error: 'Invalid page' });
    const balance = await client.readContract({ address: contract, abi: honourAbi, functionName: 'balanceOf', args: [who] });
    const pending = store.pending(who);
    const scores: Record<string, ReturnType<Store['score']>> = {};
    for (const e of pending) {
      const other = e.from === who ? e.to : e.from;
      if (!scores[other]) scores[other] = store.score(other, viewer);
    }
    return send(200, { address: who, balance: balance.toString(), history: store.history(who, page), pending, scores,
      trust: store.score(who, viewer), page, status });
  } catch { return send(503, { error: 'Account data is unavailable. Please retry.' }); }
});
server.requestTimeout = 20_000;
server.listen(Number(process.env.PORT ?? 8787), '127.0.0.1', () => console.log('Honour indexer listening on loopback'));
await sync();
const interval = setInterval(() => void sync(), 4000);
process.on('SIGTERM', () => { stopped = true; clearInterval(interval); server.close(() => process.exit(0)); });
