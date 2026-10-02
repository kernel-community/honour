import { mkdir, writeFile, access } from 'node:fs/promises';
import { network, artifacts } from 'hardhat';
import { createWalletClient, http, formatEther } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { mainnet } from 'viem/chains';
import { createInterface } from 'node:readline/promises';

const { viem } = await network.create();
const publicClient = await viem.getPublicClient();
const chainId = await publicClient.getChainId();
const artifact = await artifacts.readArtifact('Honour');
let hash: `0x${string}`;
if (chainId === 31337) {
  const [wallet] = await viem.getWalletClients();
  hash = await wallet.deployContract({ abi: artifact.abi, bytecode: artifact.bytecode as `0x${string}` });
} else if (chainId === 1) {
  // This script runs only on the deployer's machine, never on Vercel/geth.
  // Supply an ephemeral deployment key through the shell; do not commit it.
  const key = process.env.DEPLOYER_PRIVATE_KEY?.trim().replace(/^0x/i, '');
  if (!key) throw new Error('Set DEPLOYER_PRIVATE_KEY in the deployment shell before running this command.');
  if (!/^[0-9a-fA-F]{64}$/.test(key)) throw new Error('Invalid key format: expected 64 hexadecimal characters, optionally prefixed with 0x. Paste the private key, without quotes, at the hidden prompt.');
  let account;
  try { account = privateKeyToAccount(`0x${key}`); }
  catch { throw new Error('The supplied value is not a valid Ethereum private key.'); }
  const wallet = createWalletClient({ chain: mainnet, account, transport: http(process.env.MAINNET_RPC_URL) });
  const existing = new URL('../deployments/mainnet.json', import.meta.url);
  if (await access(existing).then(() => true, () => false)) throw new Error('A mainnet deployment record already exists. Reuse it rather than redeploying.');
  const pending = new URL('../deployments/mainnet-pending.json', import.meta.url);
  if (await access(pending).then(() => true, () => false)) throw new Error('A deployment transaction was already submitted. Recover its receipt before trying again.');
  const balance = await publicClient.getBalance({ address: account.address });
  console.log(`Ethereum mainnet\nDeploying one Honour contract (no constructor arguments).\nSigner: ${account.address}\nBalance: ${formatEther(balance)} ETH`);
  if (balance === 0n) throw new Error('Fund this account on Ethereum mainnet, then run this command again.');
  const prompt = createInterface({ input: process.stdin, output: process.stdout });
  const answer = await prompt.question('Type deploy to sign and broadcast: ');
  prompt.close();
  if (answer !== 'deploy') throw new Error('Deployment cancelled.');
  hash = await wallet.deployContract({ abi: artifact.abi, bytecode: artifact.bytecode as `0x${string}` });
} else throw new Error(`Unexpected chain ${chainId}`);
console.log(`Submitted: ${hash}`);
await mkdir(new URL('../deployments/', import.meta.url), { recursive: true });
if (chainId === 1) await writeFile(new URL('../deployments/mainnet-pending.json', import.meta.url), JSON.stringify({ chainId, transactionHash: hash }, null, 2) + '\n');
const receipt = await publicClient.waitForTransactionReceipt({ hash });
if (receipt.status !== 'success' || !receipt.contractAddress) throw new Error('Deployment failed');
const deployment = { chainId, address: receipt.contractAddress, block: receipt.blockNumber.toString(), transactionHash: hash };
await mkdir(new URL('../deployments/', import.meta.url), { recursive: true });
await writeFile(new URL(`../deployments/${chainId === 1 ? 'mainnet' : '31337.local'}.json`, import.meta.url), JSON.stringify(deployment, null, 2) + '\n');
console.log(JSON.stringify(deployment, null, 2));
