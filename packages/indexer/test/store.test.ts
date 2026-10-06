import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Store } from '../src/store.ts';
import { trustScore, interactions, parseAmount, type HonourEvent, type Interaction } from '@honour/contracts/domain';

test('restarting and replaying a batch does not duplicate offers or lose completion', () => {
  const dir = mkdtempSync(join(tmpdir(), 'honour-'));
  const file = join(dir, 'test.sqlite');
  const e: HonourEvent = { type: 'Proposed', from: 'alice', to: 'bob', offerId: '1', amount: '100', hash: 'a', block: 5, timestamp: 1, transactionIndex: 0, logIndex: 0 };
  let db = new Store(file, 'deployment', 5);
  try {
    db.save([e], 5); db.close(); db = new Store(file, 'deployment', 5);
    db.save([e], 5);
    assert.equal(db.history('bob').length, 1); assert.equal(db.cursor, 5);
    assert.equal(db.pending('bob').length, 1);
    db.save([{ ...e, type: 'Honoured', hash: 'b', block: 6 }], 6);
    assert.equal(db.pending('bob').length, 0);
    assert.throws(() => db.save([{ ...e, amount: undefined as unknown as string }], 7));
    assert.equal(db.cursor, 6);
  } finally { db.close(); rmSync(dir, { recursive: true }); }
});

test('repeated relationships, unsolicited offers and forgiveness cannot inflate trust', () => {
  const tx = (type: Interaction['type'], who: string, received = true): Interaction => ({ type, with: who, received, amount: '1' });
  const theirs = [tx('Honoured', 'VIEWER'), tx('Honoured', 'shared'), tx('Proposed', 'spam'), tx('Accepted', 'forgiver')];
  const mine = [tx('Honoured', 'SHARED', false), tx('Proposed', 'spam'), tx('Honoured', 'forgiver')];
  const score = trustScore(theirs, mine, 'viewer', 'subject');
  assert.equal(score.score, 3);
  assert.deepEqual(score.sharedAccounts, ['shared']);
  assert.equal(trustScore([...theirs, ...theirs, ...theirs], [...mine, ...mine], 'viewer', 'subject').score, 3);
  assert.equal(trustScore([tx('Accepted', 'viewer'), tx('Forgiven', 'viewer')], mine, 'viewer', 'subject').score, 0);
  assert.equal(trustScore([tx('Honoured', 'viewer', false)], mine, 'viewer', 'subject').direct, 0);
  assert.equal(trustScore(theirs, [], 'stranger', 'subject').score, 0);
  assert.equal(trustScore([], [], 'viewer', 'subject').score, 0);
});

test('completed relationships are bilateral; forgiveness concentration uses exact received amounts', () => {
  const event: HonourEvent = { type: 'Honoured', from: 'alice', to: 'bob', offerId: '1', amount: '10', hash: 'a', block: 1, timestamp: 1, transactionIndex: 0, logIndex: 0 };
  assert.equal(interactions([event], 'ALICE')[0].received, false);
  assert.equal(interactions([event], 'bob')[0].received, true);
  assert.equal(interactions([event], 'outsider').length, 0);
  const big = 10n ** 30n;
  const history: Interaction[] = [
    { type: 'Accepted', with: 'a', received: true, amount: (big * 8n).toString() },
    { type: 'Accepted', with: 'A', received: true, amount: big.toString() },
    { type: 'Accepted', with: 'b', received: true, amount: big.toString() },
    { type: 'Accepted', with: 'c', received: false, amount: (big * 100n).toString() },
    { type: 'Forgiven', with: 'c', received: true, amount: (big * 100n).toString() },
  ];
  const score = trustScore(history, [], 'viewer', 'subject');
  assert.equal(score.score, 0);
  assert.deepEqual(score.forgiveness, { acceptedCount: 3, knownSourceCount: 0, sourceCount: 2, total: (big * 10n).toString(), largest: (big * 9n).toString(), largestSource: 'a', largestPercent: 90 });
  const familiar: Interaction[] = [
    { type: 'Proposed', with: 'A', received: false, amount: '1' },
    { type: 'Honoured', with: 'a', received: true, amount: '1' },
    { type: 'Accepted', with: 'b', received: true, amount: '1' },
    { type: 'Honoured', with: 'c', received: true, amount: '1' },
  ];
  assert.equal(trustScore(history, familiar, 'viewer', 'subject').forgiveness.knownSourceCount, 2);
  assert.equal(trustScore(history, familiar, 'a', 'subject').forgiveness.knownSourceCount, 1);
  assert.equal(parseAmount('1.000000000000000001'), 1000000000000000001n);
  assert.throws(() => parseAmount('0.0000000000000000001'));
});
