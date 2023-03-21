import { ethers } from 'ethers'

export const lookUpEns = async (account) => {
  if (!account) return account
  const provider = new ethers.providers.CloudflareProvider() // defaults to homestead
  const ens = await provider.lookupAddress(account)
  return ens ?? account
}
