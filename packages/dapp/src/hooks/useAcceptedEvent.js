import { useEffect } from 'react'
import { formatUnits } from 'viem'
import { addresses, abis } from '../utils/constants'
import { useBalanceReducer } from '../contexts/Balance'
import { useWallet } from '../contexts/Wallet'

function useAcceptedEvent (chainId) {
  const { decreaseBalance } = useBalanceReducer()
  const { publicClient } = useWallet()

  useEffect(() => {
    if (!publicClient || !chainId) return

    const contractAddress = addresses.chainIdToContractAddresses(chainId).Honour
    const unwatch = publicClient.watchContractEvent({
      address: contractAddress,
      abi: JSON.parse(abis.Honour),
      eventName: 'Accepted',
      onLogs: (logs) => {
        logs.forEach((log) => {
          const { forgiver, forgiven, amount } = log.args
          console.log('Forgiver: ', forgiver)
          console.log('Forgiven: ', forgiven)
          const amountFormatted = formatUnits(amount, 18)
          console.log('Amount: ', amountFormatted)
          decreaseBalance(amountFormatted)
        })
      }
    })

    return () => {
      unwatch()
    }
  }, [publicClient, chainId, decreaseBalance])
}

export default useAcceptedEvent
