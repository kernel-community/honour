import { formatUnits, getAddress, isAddress, parseUnits, zeroAddress } from 'viem';

export type EventKind = 'Proposed' | 'Honoured' | 'Forgiven' | 'Accepted';
export type HonourEvent = {
  type: EventKind; from: string; to: string; offerId: string; amount: string;
  block: number; logIndex: number; transactionIndex: number; hash: string; timestamp: number;
};
export type Interaction = { type: EventKind; with: string; amount: string };
export function interactions(events: HonourEvent[], address: string): Interaction[] {
  const who = address.toLowerCase();
  return events.filter(e => (e.type === 'Proposed' || e.type === 'Forgiven' ? e.from : e.to).toLowerCase() === who)
    .map(e => ({ type: e.type, with: (e.from.toLowerCase() === who ? e.to : e.from).toLowerCase(), amount: e.amount }));
}

// Preserve the original viewer-relative algorithm, including repeated shared
// interactions and the average across all activity. Integer math avoids rounding HON.
export function trustScore(theirs: Interaction[], mine: Interaction[], viewer: string) {
  const frequencies = new Map<string, number>();
  for (const tx of mine) frequencies.set(tx.with.toLowerCase(), (frequencies.get(tx.with.toLowerCase()) ?? 0) + 1);
  let shared = 0, direct = 0, unusual = 0;
  const total = theirs.reduce((sum, tx) => sum + BigInt(tx.amount), 0n);
  const count = BigInt(theirs.length);
  const isLarge = (amount: string) => count > 0n && BigInt(amount) * count > 100n * total;
  for (const tx of theirs) {
    shared += frequencies.get(tx.with.toLowerCase()) ?? 0;
    if (tx.with.toLowerCase() === viewer.toLowerCase() && ['Honoured', 'Forgiven', 'Accepted'].includes(tx.type)) direct += 2;
    if (tx.type === 'Accepted' && isLarge(tx.amount)) unusual -= 1;
  }
  if (theirs.some(tx => isLarge(tx.amount))) unusual -= 1;
  return { score: shared + direct + unusual, shared, direct, unusual };
}
export type Trust = ReturnType<typeof trustScore>;
export function parseAmount(value: string): bigint {
  if (!/^(?:0|[1-9]\d*)(?:\.\d{1,18})?$/.test(value)) throw new Error('Enter a positive amount with at most 18 decimal places.');
  const amount = parseUnits(value, 18);
  if (amount <= 0n || amount >= 2n ** 256n) throw new Error('Enter a valid positive HON amount.');
  return amount;
}
export function address(value: string): `0x${string}` {
  if (!isAddress(value) || value.toLowerCase() === zeroAddress) throw new Error('Enter a valid, non-zero Ethereum address.');
  return getAddress(value);
}
export const displayHon = (amount: string | bigint) => formatUnits(BigInt(amount), 18);
export const shortAddress = (value: string) => `${value.slice(0, 6)}…${value.slice(-4)}`;
