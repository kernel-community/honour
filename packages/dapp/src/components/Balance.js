import React, { useState, useEffect } from 'react'
import { useWallet } from '../contexts/Wallet'
import { useSmartAccount } from '../contexts/SmartAccount'
import { useFreeMode } from '../contexts/FreeMode'
import { useBalanceReducer } from '../contexts/Balance'
import { balanceOf } from '../utils/contracts'
import Loading from './common/Loading'

const Balance = () => {
  const { chainId, publicClient, address } = useWallet()
  const { smartAccountAddress } = useSmartAccount()
  const { freeMode } = useFreeMode()
  
  // Use smart account address when freeMode is on, EOA when off
  const accountAddress = freeMode ? smartAccountAddress : address

  const { balance, setBalance } = useBalanceReducer()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (accountAddress && chainId && publicClient) {
      const fetchBalance = async () => {
        const balance = await balanceOf(chainId, publicClient, accountAddress)
        setBalance(balance)
        setLoading(false)
      }
      fetchBalance()
    }
  }, [chainId, publicClient, accountAddress, setBalance])

  return (
    <div className='flex flex-col w-screen items-center '>
      <div className='flex md:text-8xl text-4xl flex-grow font-volkhorn text-gray-700 self-center'>
        <div className='my-auto text-center'>
          Honour
        </div>
      </div>
      {loading
        ? (
          <Loading />
          )
        : (
          <div>
            <div className='text-center text-l mt-20'>
              Your current obligation is:
            </div>
            <div className='text-center text-4xl my-4'>
              {balance.slice(0, 5)}
            </div>
          </div>
          )}
    </div>
  )
}

export default Balance
