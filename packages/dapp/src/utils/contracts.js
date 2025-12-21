import { addresses, abis } from './constants'
import { parseUnits, formatUnits } from 'viem'

// Helper to create transaction object with wait method
const createTxWithWait = (hash, publicClient) => {
  return {
    hash,
    wait: async (confirmations = 1) => {
      const receipt = await publicClient.waitForTransactionReceipt({ hash, confirmations })
      return receipt
    }
  }
}

// function to propose HON creation
export const propose = async (receiver, amount, chainId, walletClient, publicClient) => {
  const contractAddress = addresses.chainIdToContractAddresses(chainId).Honour
  const amountBN = parseUnits(amount.toString(), 18)
  
  const hash = await walletClient.writeContract({
    address: contractAddress,
    abi: JSON.parse(abis.Honour),
    functionName: 'propose',
    args: [receiver, amountBN]
  })
  
  return createTxWithWait(hash, publicClient)
}

// function to honour HON proposal
export const honour = async (proposer, id, chainId, walletClient, publicClient) => {
  const contractAddress = addresses.chainIdToContractAddresses(chainId).Honour
  
  const hash = await walletClient.writeContract({
    address: contractAddress,
    abi: JSON.parse(abis.Honour),
    functionName: 'honour',
    args: [proposer, id]
  })
  
  return createTxWithWait(hash, publicClient)
}

// function to forgive HON
export const forgive = async (forgiven, amount, chainId, walletClient, publicClient) => {
  const contractAddress = addresses.chainIdToContractAddresses(chainId).Honour
  const amountBN = parseUnits(amount.toString(), 18)
  
  const hash = await walletClient.writeContract({
    address: contractAddress,
    abi: JSON.parse(abis.Honour),
    functionName: 'forgive',
    args: [forgiven, amountBN]
  })
  
  return createTxWithWait(hash, publicClient)
}

// function to accept HON forgiveness
export const accept = async (forgiver, id, chainId, walletClient, publicClient) => {
  const contractAddress = addresses.chainIdToContractAddresses(chainId).Honour
  
  const hash = await walletClient.writeContract({
    address: contractAddress,
    abi: JSON.parse(abis.Honour),
    functionName: 'accept',
    args: [forgiver, id]
  })
  
  return createTxWithWait(hash, publicClient)
}

// function to fetch HON balance
export const balanceOf = async (chainId, publicClient, address) => {
  const contractAddress = addresses.chainIdToContractAddresses(chainId).Honour
  
  const balance = await publicClient.readContract({
    address: contractAddress,
    abi: JSON.parse(abis.Honour),
    functionName: 'balanceOf',
    args: [address]
  })
  
  const balanceFormatted = formatUnits(balance, 18)
  return balanceFormatted
}
