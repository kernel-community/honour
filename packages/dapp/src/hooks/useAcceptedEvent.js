import { useContractEvent } from 'wagmi'
import { ethers } from 'ethers'
import { addresses, abis } from '../utils/constants'
import { useBalanceReducer } from '../context/Balance'

function useAcceptedEvent (chainId) {
  const { decreaseBalance } = useBalanceReducer()

  useContractEvent({
    address: addresses.chainIdToContractAddresses(chainId).Honour,
    abi: abis.Honour,
    eventName: 'Accepted',
    listener (forgiver, forgiven, bn) {
      console.log('Forgiver: ', forgiver)
      console.log('Forgiven: ', forgiven)
      const amountBN = ethers.BigNumber.from(bn._hex)
      const amountDecimal = amountBN.toBigInt()
      const amount = ethers.utils.formatUnits(amountDecimal, 18)
      console.log('Amount: ', amount)
      decreaseBalance(amount)
    }
  })
}

export default useAcceptedEvent
