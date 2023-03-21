import { useContractEvent } from 'wagmi'
import { ethers } from 'ethers'
import { addresses, abis } from '../utils/constants'
import { useBalanceReducer } from '../context/Balance'

function useHonouredEvent (chainId) {
  const { increaseBalance } = useBalanceReducer()

  useContractEvent({
    address: addresses.chainIdToContractAddresses(chainId).Honour,
    abi: abis.Honour,
    eventName: 'Honoured',
    listener (proposer, receiver, bn) {
      console.log('Proposer: ', proposer)
      console.log('Receiver: ', receiver)
      const amountBN = ethers.BigNumber.from(bn._hex)
      const amountDecimal = amountBN.toBigInt()
      const amount = ethers.utils.formatUnits(amountDecimal, 18)
      console.log('Amount: ', amount)
      increaseBalance(amount)
    }
  })
}

export default useHonouredEvent
