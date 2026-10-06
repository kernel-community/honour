import { formatUnits, getAddress, isAddress, parseUnits, zeroAddress } from 'viem';

export type EventKind = 'Proposed' | 'Honoured' | 'Forgiven' | 'Accepted';
export type HonourEvent = {
  type: EventKind; from: string; to: string; offerId: string; amount: string;
  block: number; logIndex: number; transactionIndex: number; hash: string; timestamp: number;
};
export type Interaction = { type: EventKind; with: string; amount: string; received?: boolean };
export function interactions(events: HonourEvent[], address: string): Interaction[] {
  const who = address.toLowerCase();
  return events.filter(e => e.from.toLowerCase() === who || e.to.toLowerCase() === who)
    .map(e => ({ type: e.type, with: (e.from.toLowerCase() === who ? e.to : e.from).toLowerCase(), amount: e.amount, received: e.to.toLowerCase() === who }));
}

// Completed proposal relationships count once. Neither unsolicited offers nor
// accepting forgiveness can manufacture positive evidence through repetition.
export function trustScore(theirs: Interaction[], mine: Interaction[], viewer: string, subject?: string) {
  const viewerAddress = viewer.toLowerCase();
  const subjectAddress = subject?.toLowerCase();
  const connections = (history: Interaction[]) => new Set(history
    .filter(tx => tx.type === 'Honoured')
    .map(tx => tx.with.toLowerCase())
    .filter(who => who !== viewerAddress && who !== subjectAddress));
  const theirConnections = connections(theirs), myConnections = connections(mine);
  const sharedAccounts = [...theirConnections].filter(who => myConnections.has(who)).sort();
  const direct = theirs.some(tx => tx.type === 'Honoured' && tx.received === true && tx.with.toLowerCase() === viewerAddress) ? 2 : 0;
  const sources = new Map<string, bigint>();
  let acceptedCount = 0;
  for (const tx of theirs) {
    if (tx.type !== 'Accepted' || tx.received !== true) continue;
    const source = tx.with.toLowerCase();
    sources.set(source, (sources.get(source) ?? 0n) + BigInt(tx.amount));
    acceptedCount++;
  }
  const interactedWith = new Set(mine.map(tx => tx.with.toLowerCase()));
  const knownSourceCount = [...sources.keys()].filter(source => source !== viewerAddress && interactedWith.has(source)).length;
  const ranked = [...sources].sort(([a, av], [b, bv]) => av === bv ? a.localeCompare(b) : av > bv ? -1 : 1);
  const total = ranked.reduce((sum, [, amount]) => sum + amount, 0n);
  const largest = ranked[0]?.[1] ?? 0n;
  return {
    score: sharedAccounts.length + direct, shared: sharedAccounts.length, direct, sharedAccounts,
    forgiveness: { acceptedCount, knownSourceCount, sourceCount: sources.size, total: total.toString(), largest: largest.toString(), largestSource: ranked[0]?.[0] ?? null,
      largestPercent: total > 0n ? Number(largest * 100n / total) : 0 },
  };
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
