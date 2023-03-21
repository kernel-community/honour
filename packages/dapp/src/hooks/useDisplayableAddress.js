import { useState, useEffect } from 'react'
import { useAccount, useProvider } from 'wagmi'
import { lookUpEns } from '../utils/ens'

export const useDisplayableAddress = (account = undefined) => {
  const { address, isError } = useAccount()

  const [toDisplay, setToDisplay] = useState(address ? address.substring(0, 8) + '...' : '')
  const provider = useProvider()

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
  }, [address, provider, account])

  if (isError) { console.log('We failed to fetch all signing accounts. Please try reloading the page.') }
  return toDisplay
}
