'use client';
import { WalletClientSigner } from '@aa-sdk/core';
import { alchemy, mainnet } from '@account-kit/infra';
import { createSmartWalletClient } from '@account-kit/wallet-client';
import { createWalletClient, custom, encodeFunctionData, type Address, type EIP1193Provider } from 'viem';
import { honourAbi } from '@honour/contracts/abi';
import { confirmedHash } from './confirmation';
import { smartAccountForSigner } from './recipient';

export type BrowserProvider = EIP1193Provider & { on?: (name: string, handler: (...args: unknown[]) => void) => void; removeListener?: (name: string, handler: (...args: unknown[]) => void) => void };
declare global { interface Window { ethereum?: BrowserProvider } }
export async function connectAccount() {
  if (!window.ethereum) throw new Error('Open Honour in your wallet’s browser, or install an Ethereum wallet to begin.');
  const provider = window.ethereum;
  const wallet = createWalletClient({ chain: mainnet, transport: custom(provider) });
  const [owner] = await wallet.requestAddresses();
  if (await wallet.getChainId() !== 1) await wallet.switchChain({ id: 1 });
  const signer = new WalletClientSigner(wallet, 'honour-wallet');
  const transport = alchemy({ rpcUrl: new URL('/api/wallet', location.origin).href, retryCount: 0 });
  const accountAddress = await smartAccountForSigner(owner);
  const client = createSmartWalletClient({ chain: mainnet, signer, transport, account: accountAddress });
  return { owner, address: accountAddress, client, provider };
}
export type Connected = Awaited<ReturnType<typeof connectAccount>>;
export async function sendHonour(connected: Connected, contract: Address, action: 'propose' | 'forgive' | 'honour' | 'accept', recipient: Address, value: bigint, progress: (message: string) => void) {
  const [owner] = await connected.provider.request({ method: 'eth_accounts' });
  const chain = await connected.provider.request({ method: 'eth_chainId' });
  if (owner?.toLowerCase() !== connected.owner.toLowerCase() || chain !== '0x1') throw new Error('Your wallet changed. Reconnect before continuing.');
  progress('Confirm in your wallet');
  const result = await connected.client.sendCalls({ calls: [{ to: contract, value: '0x0', data: encodeFunctionData({ abi: honourAbi, functionName: action, args: [recipient, value] }) }] });
  const id = result.id ?? result.preparedCallIds?.[0];
  if (!id) throw new Error('The account service did not return an operation ID.');
  // Retain the operation ID so a timeout/reload cannot invite a duplicate submission.
  sessionStorage.setItem(`honour:pending:${connected.address}`, id);
  progress('Confirming on Ethereum');
  return waitForHonour(connected, id);
}
export async function waitForHonour(connected: Connected, id: `0x${string}`) {
  for (let attempt = 0; attempt < 90; attempt++) {
    let hash;
    try { hash = confirmedHash(await connected.client.getCallsStatus(id)); }
    catch (error) {
      if (error instanceof Error && /operation failed|operation reverted/.test(error.message)) sessionStorage.removeItem(`honour:pending:${connected.address}`);
      throw error;
    }
    if (hash) { sessionStorage.removeItem(`honour:pending:${connected.address}`); return hash; }
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  throw new Error('Still waiting for confirmation. Check this operation again before sending another.');
}
