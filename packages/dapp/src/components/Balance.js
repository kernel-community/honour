import React, { useState, useEffect } from 'react'
import { useWallet } from '../contexts/Wallet'
import { useBalanceReducer } from '../contexts/Balance'
import { balanceOf } from '../utils/contracts'
import Loading from './common/Loading'

const Balance = () => {
  const { chainId, address, publicClient } = useWallet()

  const { balance, setBalance } = useBalanceReducer()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (address && chainId && publicClient) {
      const fetchBalance = async () => {
        const balance = await balanceOf(chainId, publicClient, address)
        setBalance(balance)
        setLoading(false)
      }
      fetchBalance()
    }
  }, [chainId, publicClient, address, setBalance])

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
