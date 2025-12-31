import { addresses, abis } from './constants'
import { parseUnits, formatUnits, encodeFunctionData } from 'viem'

// Helper to extract the "Details:" part from error messages
export const extractErrorDetails = (errorMessage) => {
  if (!errorMessage) return 'Unknown error'
  
  // Look for "Details: " in the error message (case insensitive)
  // Match everything after "Details:" until "Version:" or end of string
  const detailsMatch = errorMessage.match(/Details:\s*(.+?)(?:\s+Version:|$)/is)
  if (detailsMatch && detailsMatch[1]) {
    return detailsMatch[1].trim()
  }
  
  // If no "Details:" found, try to extract a meaningful error message
  // Look for common error patterns
  if (errorMessage.includes('User rejected')) {
    return 'User rejected the request'
  }
  if (errorMessage.includes('insufficient funds')) {
    return 'Insufficient funds'
  }
  if (errorMessage.includes('network')) {
    return 'Network error'
  }
  
  // Fallback: return the original message if it's short, otherwise a generic message
  return errorMessage.length > 100 ? 'Transaction failed' : errorMessage
}

// Helper to create transaction object with wait method
const createTxWithWait = (hash, publicClient) => {
  return {
    hash,
    wait: async (confirmations = 1) => {
      // Since we got the hash from status 200, the transaction is already confirmed
      // Return a receipt-like object immediately
      return {
        status: 'success',
        transactionHash: hash,
        blockNumber: 0n
      }
    }
  }
}

// Helper to send transaction via smart account or regular wallet
const sendTransaction = async (client, contractAddress, abi, functionName, args, publicClient) => {
  // Check for regular wallet client first (has writeContract method)
  // This ensures we use regular wallet when freeMode is off
  if (client && typeof client.writeContract === 'function') {
    // Regular wallet client - use writeContract
    try {
      // Get the account from the wallet client
      const [account] = await client.getAddresses()
      if (!account) {
        throw new Error('No account found in wallet client')
      }
      
      const hash = await client.writeContract({
        account,
        address: contractAddress,
        abi,
        functionName,
        args
      })
      
      return createTxWithWait(hash, publicClient)
    } catch (error) {
      throw new Error(`Wallet transaction failed: ${error.message || 'Unknown error'}`)
    }
  }
  
  // Check if it's a smart account client (Account Kit wallet client)
  // Smart account clients have sendCalls AND getCallsStatus methods
  const hasSendCalls = client && typeof client.sendCalls === 'function'
  const hasGetCallsStatus = client && typeof client.getCallsStatus === 'function'
  
  // It's a smart account client if it has both sendCalls and getCallsStatus
  if (hasSendCalls && hasGetCallsStatus) {
    try {
      // Encode the function call data
      const callData = encodeFunctionData({
        abi,
        functionName,
        args
      })
      
      // Use sendCalls which handles prepare, sign, and send in one call
      // The client already has the account configured
      const result = await client.sendCalls({
        calls: [{
          to: contractAddress,
          value: '0x0',
          data: callData
        }],
        capabilities: {
          ...(process.env.REACT_APP_ALCHEMY_PAYMASTER_POLICY_ID && {
            paymasterService: {
              policyId: process.env.REACT_APP_ALCHEMY_PAYMASTER_POLICY_ID
            }
          })
        }
      })
      
      const callId = result.preparedCallIds?.[0] || result.ids?.[0]
      
      if (!callId) {
        throw new Error('No call ID returned from sendCalls')
      }
      
      // Poll for status 200 (confirmed) to get the transaction hash
      let txHash = null
      let attempts = 0
      const maxAttempts = 60
      
      while (!txHash && attempts < maxAttempts) {
        const status = await client.getCallsStatus(callId)
        
        if (status.status === 200) {
          txHash = status.details?.data?.hash
          if (txHash) {
            break
          }
        }
        
        if (status.status === 'FAILED' || status.error || (typeof status.status === 'number' && status.status >= 400)) {
          throw new Error(status.error || status.message || 'Transaction failed')
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000))
        attempts++
      }
      
      if (!txHash) {
        throw new Error(`Transaction hash not found after ${maxAttempts} seconds`)
      }
      
      // Since status is already 200 (confirmed), we can return immediately
      // The transaction is already on-chain, so wait(1) should resolve quickly
      return createTxWithWait(txHash, publicClient)
    } catch (error) {
      throw new Error(`Smart account transaction failed: ${error.message || 'Unknown error'}`)
    }
  }
  
  // If we get here, the client doesn't match either pattern
  throw new Error('Invalid client: must be either smart account or wallet client')
}

// function to propose HON creation
export const propose = async (receiver, amount, chainId, client, publicClient) => {
  const contractAddress = addresses.chainIdToContractAddresses(chainId).Honour
  const abi = JSON.parse(abis.Honour)
  const amountBN = parseUnits(amount.toString(), 18)
  
  return sendTransaction(client, contractAddress, abi, 'propose', [receiver, amountBN], publicClient)
}

// function to honour HON proposal
export const honour = async (proposer, id, chainId, client, publicClient) => {
  const contractAddress = addresses.chainIdToContractAddresses(chainId).Honour
  const abi = JSON.parse(abis.Honour)
  
  return sendTransaction(client, contractAddress, abi, 'honour', [proposer, id], publicClient)
}

// function to forgive HON
export const forgive = async (forgiven, amount, chainId, client, publicClient) => {
  const contractAddress = addresses.chainIdToContractAddresses(chainId).Honour
  const abi = JSON.parse(abis.Honour)
  const amountBN = parseUnits(amount.toString(), 18)
  
  return sendTransaction(client, contractAddress, abi, 'forgive', [forgiven, amountBN], publicClient)
}

// function to accept HON forgiveness
export const accept = async (forgiver, id, chainId, client, publicClient) => {
  const contractAddress = addresses.chainIdToContractAddresses(chainId).Honour
  const abi = JSON.parse(abis.Honour)
  
  return sendTransaction(client, contractAddress, abi, 'accept', [forgiver, id], publicClient)
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
