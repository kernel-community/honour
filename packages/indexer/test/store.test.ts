import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Store } from '../src/store.ts';
import { trustScore, parseAmount, type HonourEvent } from '@honour/contracts/domain';

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

test('score retains repeated shared interactions and direct weights; amounts remain exact', () => {
  const theirs = [{ type: 'Honoured' as const, with: 'ALICE', amount: '1000000000000000001' }];
  const mine = [{ type: 'Proposed' as const, with: 'alice', amount: '1' }, { type: 'Forgiven' as const, with: 'ALICE', amount: '1' }];
  assert.deepEqual(trustScore(theirs, mine, 'alice'), { score: 4, shared: 2, direct: 2, unusual: 0 });
  assert.equal(trustScore([], [], 'alice').score, 0);
  assert.equal(parseAmount('1.000000000000000001'), 1000000000000000001n);
  assert.throws(() => parseAmount('0.0000000000000000001'));
  const history = Array.from({ length: 101 }, () => ({ type: 'Proposed' as const, with: 'bob', amount: '1' }));
  assert.equal(trustScore([...history, { type: 'Accepted', with: 'bob', amount: '1000000' }], [], 'alice').unusual, -2);
});
