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
  const { token, a, b, c } = await setup();
  await token.write.propose([a.address, 10n], { account: b });
  await token.write.honour([b.address, 1n], { account: a });
  await token.write.propose([b.address, 10n], { account: a });
  await token.write.honour([a.address, 2n], { account: b });
  await token.write.propose([c.address, 10n], { account: a });
  await token.write.honour([a.address, 3n], { account: c });
  await token.write.forgive([b.address, 10n], { account: a });
  await token.write.forgive([b.address, 10n], { account: c });
  await token.write.accept([a.address, 1n], { account: b });
  await assert.rejects(token.write.accept([c.address, 2n], { account: b }));
  assert.equal(await token.read.totalSupply(), 20n);
});


test('per-recipient commitments cannot be reused, even across balance drops and replenishment', async () => {
  const { token, a, b, c } = await setup();
  for (const [i, recipient] of [a, b, c].entries()) {
    const proposer = recipient === a ? b : a;
    await token.write.propose([recipient.address, 10n], { account: proposer });
    await token.write.honour([proposer.address, BigInt(i + 1)], { account: recipient });
  }
  await token.write.forgive([b.address, 6n], { account: a }); // 1
  await token.write.forgive([b.address, 4n], { account: a }); // 2
  await assert.rejects(token.write.forgive([b.address, 1n], { account: a }));
  assert.equal(await token.read.forgivenessOffered([a.address, b.address]), 10n);
  assert.equal(await token.read.forgivenessAvailable([a.address, c.address]), 10n);
  await token.write.forgive([c.address, 10n], { account: a }); // 3: independent recipient
  await token.write.forgive([a.address, 5n], { account: c }); // 4
  await token.write.accept([c.address, 4n], { account: a }); // balance 10 -> 5
  assert.equal(await token.read.forgivenessAvailable([a.address, b.address]), 0n);
  await token.write.accept([a.address, 1n], { account: b });
  await token.write.accept([a.address, 2n], { account: b }); // offers survive the drop
  assert.equal(await token.read.forgivenessOffered([a.address, b.address]), 10n);
  // Replenishing to the old balance must not reset the allowance.
  await token.write.propose([a.address, 5n], { account: b });
  await token.write.honour([b.address, 4n], { account: a });
  assert.equal(await token.read.forgivenessAvailable([a.address, b.address]), 0n);
  await token.write.propose([a.address, 5n], { account: b });
  await token.write.honour([b.address, 5n], { account: a });
  assert.equal(await token.read.forgivenessAvailable([a.address, b.address]), 5n);
  await token.write.propose([b.address, 10n], { account: a });
  await token.write.honour([a.address, 6n], { account: b });
  await assert.rejects(token.write.forgive([b.address, 6n], { account: a }));
  await token.write.forgive([b.address, 5n], { account: a });
  assert.equal(await token.read.forgivenessAvailable([a.address, b.address]), 0n);
});
