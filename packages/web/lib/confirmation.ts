import type { Hex } from 'viem';
function object(v: unknown): Record<string, unknown> { if (!v || typeof v !== 'object') throw new Error('Invalid operation status'); return v as Record<string, unknown>; }
export function confirmedHash(value: unknown): Hex | null {
  const s = object(value);
  if (Number(s.status) >= 400) throw new Error('The operation failed. Your HON was not changed.');
  if (s.status !== 200) return null;
  const receipts = s.receipts;
  if (!Array.isArray(receipts) || !receipts.length) return null;
  for (const receipt of receipts) {
    const r = object(receipt);
    if (r.status !== '0x1' && r.status !== 'success') throw new Error('The operation reverted.');
  }
  const hash = String(object(receipts[0]).transactionHash);
  return /^0x[0-9a-fA-F]{64}$/.test(hash) ? hash as Hex : null;
}
