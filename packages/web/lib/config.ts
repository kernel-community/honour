import 'server-only';
import { isAddress, zeroAddress } from 'viem';
export function config() {
  const contract = process.env.HONOUR_ADDRESS;
  const chainId = Number(process.env.CHAIN_ID ?? '1');
  if (![1, 31337].includes(chainId)) throw new Error('Unsupported chain');
  return {
    contract: contract && isAddress(contract) && contract !== zeroAddress ? contract : null,
    chainId,
    walletReady: chainId === 1 && !!process.env.ALCHEMY_API_KEY && !!process.env.ALCHEMY_PAYMASTER_POLICY_ID && !!process.env.WALLET_PROXY_SECRET,
  };
}
