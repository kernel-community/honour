import assert from 'node:assert/strict';
import { test } from 'node:test';
import { resolveRecipient, smartAccountForSigner } from '../lib/recipient.ts';
const owner = '0x1111111111111111111111111111111111111111';
const smart = '0x2222222222222222222222222222222222222222';
test('ENS and raw owners reach the connection account; direct accounts stay unchanged; lookup failures never fall back to the owner', async t => {
  const calls: string[] = [];
  t.mock.method(globalThis, 'fetch', async (url: string, init?: RequestInit) => {
    calls.push(url);
    if (url.startsWith('/api/data?')) return Response.json({ address: owner });
    assert.equal(JSON.parse(String(init?.body)).params[0].signerAddress, owner);
    return Response.json({ result: { accountAddress: smart } });
  });
  assert.equal(await resolveRecipient('thebluebook.eth'), await smartAccountForSigner(owner));
  assert.equal(await resolveRecipient(owner), smart);
  const before = calls.length;
  assert.equal(await resolveRecipient(smart, true), smart);
  assert.equal(calls.length, before);
  t.mock.method(globalThis, 'fetch', async () => Response.json({ error: {} }, { status: 503 }));
  await assert.rejects(resolveRecipient(owner), /Could not find/);
});
