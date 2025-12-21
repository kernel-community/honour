import { useEffect } from 'react'
import { formatUnits } from 'viem'
import { addresses, abis } from '../utils/constants'
import { useBalanceReducer } from '../contexts/Balance'
import { useWallet } from '../contexts/Wallet'

function useHonouredEvent (chainId) {
  const { increaseBalance } = useBalanceReducer()
  const { publicClient } = useWallet()

  useEffect(() => {
    if (!publicClient || !chainId) return

    const contractAddress = addresses.chainIdToContractAddresses(chainId).Honour
    const unwatch = publicClient.watchContractEvent({
      address: contractAddress,
      abi: JSON.parse(abis.Honour),
      eventName: 'Honoured',
      onLogs: (logs) => {
        logs.forEach((log) => {
          const { proposer, receiver, amount } = log.args
          console.log('Proposer: ', proposer)
          console.log('Receiver: ', receiver)
          const amountFormatted = formatUnits(amount, 18)
          console.log('Amount: ', amountFormatted)
          increaseBalance(amountFormatted)
        })
      }
    })

    return () => {
      unwatch()
    }
  }, [publicClient, chainId, increaseBalance])
}

export default useHonouredEvent
