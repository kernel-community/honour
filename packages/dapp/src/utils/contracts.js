import { addresses, abis } from './constants'
import { ethers, Contract } from 'ethers'

// function to propose HON creation
export const propose = async (receiver, amount, chainId, signer) => {
  const contract = new Contract(
    addresses.chainIdToContractAddresses(chainId).Honour,
    abis.Honour,
    signer
  )
  const amountBN = ethers.BigNumber.from(ethers.utils.parseUnits(amount.toString(), 18))
  const proposal = await contract.propose(receiver, amountBN)
  return proposal
}

// // function to honour HON proposal
export const honour = async (proposer, id, chainId, signer) => {
  const contract = new Contract(
    addresses.chainIdToContractAddresses(chainId).Honour,
    abis.Honour,
    signer
  )
  const honour = await contract.honour(proposer, id)
  return honour
}

// function to forgive HON
export const forgive = async (forgiven, amount, chainId, signer) => {
  const contract = new Contract(
    addresses.chainIdToContractAddresses(chainId).Honour,
    abis.Honour,
    signer
  )
  const amountBN = ethers.BigNumber.from(ethers.utils.parseUnits(amount.toString(), 18))
  const forgiveness = await contract.forgive(forgiven, amountBN)
  return forgiveness
}

// // function to accept HON forgiveness
export const accept = async (forgiver, id, chainId, signer) => {
  const contract = new Contract(
    addresses.chainIdToContractAddresses(chainId).Honour,
    abis.Honour,
    signer
  )
  const accept = await contract.accept(forgiver, id)
  return accept
}

// function to fetch HON balance
export const balanceOf = async (chainId, provider, address) => {
  const contract = new Contract(
    addresses.chainIdToContractAddresses(chainId).Honour,
    abis.Honour,
    provider
  )
  const balance = await contract.balanceOf(address)
  const balanceFormatted = ethers.utils.formatUnits(balance, 'ether')
  return balanceFormatted
}
