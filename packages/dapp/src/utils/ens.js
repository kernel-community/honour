import { createPublicClient, http } from 'viem'
import { mainnet } from 'viem/chains'

export const lookUpEns = async (account) => {
  if (!account) return account
  
  const publicClient = createPublicClient({
    chain: mainnet,
    transport: http()
  })
  
  try {
    const ens = await publicClient.getEnsName({ address: account })
    return ens ?? account
  } catch (error) {
    return account
  }
}
