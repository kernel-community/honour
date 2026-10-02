import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createPublicClient, createWalletClient, decodeEventLog, http, parseEther } from 'viem';
import { hardhat } from 'viem/chains';
import { honourAbi } from '../src/abi.ts';
const deployment = JSON.parse(await readFile(new URL('../deployments/31337.local.json', import.meta.url), 'utf8'));
const client = createPublicClient({ chain: hardhat, transport: http('http://127.0.0.1:8545') });
assert.equal(await client.getChainId(), 31337);
const wallet = createWalletClient({ chain: hardhat, transport: http('http://127.0.0.1:8545') });
const [alice, bob] = await wallet.getAddresses();
async function send(account: `0x${string}`, action: 'propose' | 'honour' | 'forgive' | 'accept', other: `0x${string}`, value: bigint) {
  const hash = await wallet.writeContract({ account, address: deployment.address, abi: honourAbi, functionName: action, args: [other, value] });
  const receipt = await client.waitForTransactionReceipt({ hash }); assert.equal(receipt.status, 'success');
  for (const log of receipt.logs) {
    const decoded = decodeEventLog({ abi: honourAbi, data: log.data, topics: log.topics });
    if (decoded.eventName === 'Proposed') return decoded.args.proposalId;
    if (decoded.eventName === 'Forgiven') return decoded.args.forgivingId;
  }
  return 0n;
}
const initial = await client.readContract({ address: deployment.address, abi: honourAbi, functionName: 'balanceOf', args: [bob] });
await send(bob, 'honour', alice, await send(alice, 'propose', bob, parseEther('100')));
await send(alice, 'honour', bob, await send(bob, 'propose', alice, parseEther('100')));
await send(bob, 'accept', alice, await send(alice, 'forgive', bob, parseEther('50')));
let result;
for (let attempt = 0; attempt < 15; attempt++) {
  const response = await fetch(`http://127.0.0.1:3000/api/data?address=${bob}&viewer=${bob}`);
  if (response.ok) { result = await response.json(); if (result.history.length >= 6 && !result.pending.length) break; }
  await new Promise(resolve => setTimeout(resolve, 1000));
}
assert.ok(result, 'Next.js data route did not return account data');
assert.equal(result.balance, (initial + parseEther('50')).toString());
assert.equal(result.pending.length, 0);
assert.equal(result.status.stale, false);
assert.ok(result.history.some((e: { type: string }) => e.type === 'Accepted'));
console.log(JSON.stringify({ account: bob, balance: result.balance, events: result.history.length, indexedBlock: result.status.block, pending: result.pending.length }));
