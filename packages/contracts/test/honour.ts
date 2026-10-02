import assert from 'node:assert/strict';
import { test } from 'node:test';
import { network } from 'hardhat';

async function setup() {
  const { viem } = await network.create();
  const [alice, bob, charlie] = await viem.getWalletClients();
  const token = await viem.deployContract('Honour');
  return { token, a: alice.account, b: bob.account, c: charlie.account };
}

test('only the recipient can mint an offer, and only once', async () => {
  const { token, a, b, c } = await setup();
  await token.write.propose([b.address, 10n], { account: a });
  await assert.rejects(token.write.honour([a.address, 1n], { account: c }));
  await token.write.honour([a.address, 1n], { account: b });
  await assert.rejects(token.write.honour([a.address, 1n], { account: b }));
  assert.equal(await token.read.balanceOf([b.address]), 10n);
  assert.equal(await token.read.totalSupply(), 10n);
});

test('forgiveness checks both balances at offer time, not the forgiver again at acceptance', async () => {
  const { token, a, b, c } = await setup();
  for (const [i, recipient] of [a, b, c].entries()) {
    const proposer = recipient === a ? b : a;
    await token.write.propose([recipient.address, 10n], { account: proposer });
    await token.write.honour([proposer.address, BigInt(i + 1)], { account: recipient });
  }
  await assert.rejects(token.write.forgive([b.address, 11n], { account: a }));
  await token.write.forgive([b.address, 10n], { account: a }); // id 1
  await token.write.forgive([a.address, 10n], { account: c }); // id 2
  await token.write.accept([c.address, 2n], { account: a }); // Alice now has zero
  await assert.rejects(token.write.forgive([b.address, 1n], { account: a }));
  await assert.rejects(token.write.forgive([a.address, 1n], { account: c }));
  await assert.rejects(token.write.accept([a.address, 1n], { account: c }));
  await token.write.accept([a.address, 1n], { account: b }); // Still intentionally valid
  await assert.rejects(token.write.accept([a.address, 1n], { account: b }));
  assert.equal(await token.read.balanceOf([b.address]), 0n);
  assert.equal(await token.read.totalSupply(), 10n);
});

test('overlapping forgiveness cannot burn a negative balance', async () => {
  const { token, a, b } = await setup();
  await token.write.propose([a.address, 10n], { account: b });
  await token.write.honour([b.address, 1n], { account: a });
  await token.write.propose([b.address, 10n], { account: a });
  await token.write.honour([a.address, 2n], { account: b });
  await token.write.forgive([b.address, 10n], { account: a });
  await token.write.forgive([b.address, 10n], { account: a });
  await token.write.accept([a.address, 1n], { account: b });
  await assert.rejects(token.write.accept([a.address, 2n], { account: b }));
  assert.equal(await token.read.totalSupply(), 10n);
});
