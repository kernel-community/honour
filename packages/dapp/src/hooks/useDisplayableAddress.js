import { useState, useEffect } from 'react'
import { useWallet } from '../contexts/Wallet'
import { lookUpEns } from '../utils/ens'

const formatAddress = (addr) => {
  if (!addr) return ''
  if (addr.length <= 10) return addr // If address is too short, return as is
  return addr.substring(0, 6) + '...' + addr.substring(addr.length - 4)
}

export const useDisplayableAddress = (account = undefined) => {
  const { address } = useWallet()

  const [toDisplay, setToDisplay] = useState(address ? formatAddress(address) : '')

  useEffect(() => {
    const fetch = async () => {
      if (!address) {
        setToDisplay('')
        return
      }
      
      let lookup = await lookUpEns(account || address)
      
      // If ENS lookup returned the address (no ENS name found), format it
      if (lookup === address || (lookup && lookup.length === 42 && lookup.startsWith('0x'))) {
        lookup = formatAddress(lookup)
      } else if (lookup && lookup.length > 15) {
        // If ENS name is long, truncate it
        lookup = lookup.substring(0, 5) + '...' + lookup.substring(lookup.length - 5)
      }
      
      setToDisplay(lookup || formatAddress(address))
    }

    fetch()
  }, [address, account])

  return toDisplay
}
