import { createHmac, timingSafeEqual } from 'node:crypto';
import { decodeFunctionData, encodeFunctionData, isAddress, zeroAddress, type Address, type Hex } from 'viem';
import { honourAbi } from '@honour/contracts/abi';

type Obj = Record<string, unknown>;
function object(value: unknown): Obj {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Expected an object');
  return value as Obj;
}
function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value && typeof value === 'object') return `{${Object.keys(value).sort().map(k => `${JSON.stringify(k)}:${canonical((value as Obj)[k])}`).join(',')}}`;
  return JSON.stringify(value);
}
function unsigned(value: unknown): Obj {
  const v = object(value);
  // v0 uses one SMA user operation, with no 7702 authorizations or batching.
  if (!['user-operation-v060', 'user-operation-v070'].includes(String(v.type))) throw new Error('Unsupported operation');
  const { signature: _signature, signatureRequest: _request, ...rest } = v;
  return rest;
}
export function issueTicket(prepared: unknown, secret: string, now = Date.now()) {
  const expires = now + 600_000;
  return `${expires}.${createHmac('sha256', secret).update(`${expires}:${canonical(unsigned(prepared))}`).digest('hex')}`;
}
export function checkTicket(signed: unknown, ticket: string, secret: string, now = Date.now()) {
  const [expiresText, signature] = ticket.split('.');
  const expires = Number(expiresText);
  if (!Number.isSafeInteger(expires) || expires < now || expires > now + 600_000 || !signature) throw new Error('Prepare the call again');
  const expected = createHmac('sha256', secret).update(`${expires}:${canonical(unsigned(signed))}`).digest('hex');
  const actual = Buffer.from(signature);
  if (actual.length !== expected.length || !timingSafeEqual(actual, Buffer.from(expected))) throw new Error('Prepared call changed');
}
export function validatePrepare(value: unknown, contract: Address, policy: string) {
  const p = object(value);
  if (p.chainId !== '0x1' || !isAddress(String(p.from)) || !Array.isArray(p.calls) || p.calls.length !== 1) throw new Error('Invalid call');
  const call = object(p.calls[0]);
  if (String(call.to).toLowerCase() !== contract.toLowerCase() || (call.value !== undefined && call.value !== '0x0')) throw new Error('Only Honour calls can be sponsored');
  if (typeof call.data !== 'string' || !/^0x[0-9a-fA-F]{136}$/.test(call.data)) throw new Error('Invalid calldata');
  const decoded = decodeFunctionData({ abi: honourAbi, data: call.data as Hex });
  if (!['propose', 'honour', 'forgive', 'accept'].includes(decoded.functionName)) throw new Error('Unsupported action');
  const [recipient, amount] = decoded.args as readonly [Address, bigint];
  if (recipient === zeroAddress || recipient.toLowerCase() === String(p.from).toLowerCase() || amount <= 0n) throw new Error('Invalid recipient or amount');
  const data = encodeFunctionData({ abi: honourAbi, functionName: decoded.functionName as 'propose', args: [recipient, amount] });
  return { from: p.from, chainId: '0x1', calls: [{ to: contract, value: '0x0', data }], capabilities: { paymasterService: { policyId: policy } } };
}
export function validateAccount(value: unknown) {
  const p = object(value);
  if (isAddress(String(p.signerAddress))) return { signerAddress: p.signerAddress, includeCounterfactualInfo: true, creationHint: { accountType: 'sma-b' } };
  if (isAddress(String(p.accountAddress))) return { accountAddress: p.accountAddress, includeCounterfactualInfo: true };
  throw new Error('Invalid signer');
}
