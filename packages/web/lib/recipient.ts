import { address } from '@honour/contracts/domain';
import type { Address } from 'viem';

// The same lookup is used at connection and before composing an offer. It also
// returns the counterfactual address when the owner has never used Honour.
export async function smartAccountForSigner(signerAddress: Address): Promise<Address> {
  const response = await fetch('/api/wallet', {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'wallet_requestAccount', params: [{ signerAddress }] }),
  });
  const data = await response.json();
  if (!response.ok || data.error || !data.result?.accountAddress) throw new Error('Could not find their Honour account. Please try again.');
  return address(data.result.accountAddress);
}

export async function resolveRecipient(input: string, direct = false): Promise<Address> {
  let text = input.trim();
  // Receiving links are explicit, including older links containing only ?to=.
  if (/^https?:\/\//i.test(text)) {
    const link = new URL(text);
    if (link.origin !== location.origin || !link.searchParams.get('to')) throw new Error('Use an Honour receiving link from this app.');
    return address(link.searchParams.get('to')!);
  }
  if (!text.startsWith('0x')) {
    const response = await fetch(`/api/data?${new URLSearchParams({ name: text })}`);
    const result = await response.json();
    if (!response.ok || !result.address) throw new Error('That name could not be resolved. Please try again.');
    text = result.address;
  }
  const owner = address(text);
  return direct ? owner : smartAccountForSigner(owner);
}
