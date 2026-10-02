import assert from 'node:assert/strict';
import { test } from 'node:test';
import { encodeFunctionData } from 'viem';
import { honourAbi } from '@honour/contracts/abi';
import { checkTicket, issueTicket, validatePrepare } from '../lib/proxy-policy.ts';
import { confirmedHash } from '../lib/confirmation.ts';
const contract = '0x1111111111111111111111111111111111111111';
const from = '0x2222222222222222222222222222222222222222';
const recipient = '0x3333333333333333333333333333333333333333';
test('sponsorship only prepares Honour calls, replacing caller-supplied capabilities', () => {
  const input = { chainId: '0x1', from, calls: [{ to: contract, data: encodeFunctionData({ abi: honourAbi, functionName: 'propose', args: [recipient, 1n] }) }], capabilities: { evil: true } };
  assert.deepEqual(validatePrepare(input, contract, 'secret-policy').capabilities, { paymasterService: { policyId: 'secret-policy' } });
  assert.throws(() => validatePrepare({ ...input, chainId: '0xa' }, contract, 'policy'));
  assert.throws(() => validatePrepare({ ...input, calls: [{ ...input.calls[0], to: recipient }] }, contract, 'policy'));
  assert.throws(() => validatePrepare({ ...input, calls: [{ ...input.calls[0], value: '0x1' }] }, contract, 'policy'));
});
test('signed operations cannot change the server-approved prepared payload', () => {
  const prepared = { type: 'user-operation-v070', chainId: '0x1', data: { sender: from, callData: '0x1234' }, signatureRequest: {} };
  const ticket = issueTicket(prepared, 'a secret', 1000);
  const { signatureRequest: _, ...rest } = prepared;
  checkTicket({ ...rest, signature: '0x1234' }, ticket, 'a secret', 1001);
  assert.throws(() => checkTicket({ ...rest, data: { sender: from, callData: '0xdead' }, signature: '0x1234' }, ticket, 'a secret', 1001));
  assert.throws(() => checkTicket(rest, ticket, 'a secret', 700000));
});
test('a hash or successful outer receipt alone is not operation success', () => {
  const hash = `0x${'a'.repeat(64)}`;
  assert.equal(confirmedHash({ status: 100, details: { data: { hash } } }), null);
  assert.equal(confirmedHash({ status: 200, receipts: [] }), null);
  assert.throws(() => confirmedHash({ status: 500, receipts: [{ status: '0x1', transactionHash: hash }] }));
  assert.throws(() => confirmedHash({ status: 200, receipts: [{ status: '0x0', transactionHash: hash }] }));
  assert.equal(confirmedHash({ status: 200, receipts: [{ status: '0x1', transactionHash: hash }] }), hash);
});
