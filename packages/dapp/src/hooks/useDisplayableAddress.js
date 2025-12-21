import { useState, useEffect } from 'react'
import { useWallet } from '../contexts/Wallet'
import { lookUpEns } from '../utils/ens'

export const useDisplayableAddress = (account = undefined) => {
  const { address } = useWallet()

  const [toDisplay, setToDisplay] = useState(address ? address.substring(0, 8) + '...' : '')

  useEffect(() => {
    const fetch = async () => {
      let lookup = ''
      if (address) {
        lookup = await lookUpEns(account || address)
        if (lookup?.length > 15) {
          lookup = lookup.substring(0, 8) + '...'
        }
      }
      setToDisplay(lookup)
    }

    fetch()
  }, [address, account])

  return toDisplay
}
