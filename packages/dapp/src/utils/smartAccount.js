import { predictModularAccountV2Address } from '@account-kit/smart-contracts'
import { isAddress } from 'viem'

// Modular Account V2 addresses for Optimism
// These are the actual addresses used by the wallet client for Modular Account V2
const MODULAR_ACCOUNT_V2_FACTORY = '0x00000000000017c61b5bEe81050EC8eFc9c6fecd'
const MODULAR_ACCOUNT_V2_IMPLEMENTATION = '0x000000000000c5a9089039570dd36455b5c07383'

/**
 * Resolve an address (EOA or smart account) to its smart account address.
 * If the address is the current user's EOA, return their smart account.
 * For other addresses, compute the smart account address using CREATE2 prediction.
 * 
 * Note: This assumes Modular Account V2 (SMA - Single Modular Account) which is
 * what the wallet client creates by default.
 * 
 * @param {string} address - The address to resolve
 * @param {string} currentUserEOA - The current user's EOA address
 * @param {string} currentUserSmartAccount - The current user's smart account address
 * @returns {Promise<string>} - The smart account address
 */
export const resolveToSmartAccountAddress = async (
  address,
  currentUserEOA,
  currentUserSmartAccount,
) => {
  if (!address || !isAddress(address)) {
    return address
  }

  const addressLower = address.toLowerCase()

  // If it's the current user's EOA, return their smart account
  if (currentUserEOA && addressLower === currentUserEOA.toLowerCase()) {
    return currentUserSmartAccount || address
  }

  // If it's already the current user's smart account, return as-is
  if (
    currentUserSmartAccount &&
    addressLower === currentUserSmartAccount.toLowerCase()
  ) {
    return address
  }

  // For other addresses, compute their smart account address
  try {
    // Salt is 0 for the first account (this is the default used by the library)
    const salt = 0n

    // Use the package function to predict the Modular Account V2 address
    // Type "SMA" = Single Modular Account (single owner)
    const smartAccountAddr = predictModularAccountV2Address({
      factoryAddress: MODULAR_ACCOUNT_V2_FACTORY,
      implementationAddress: MODULAR_ACCOUNT_V2_IMPLEMENTATION,
      salt,
      type: 'SMA',
      ownerAddress: address,
    })

    return smartAccountAddr
  } catch (error) {
    console.error('Error resolving to smart account address:', error)
    return address
  }
}
