import React, { useState, useEffect } from 'react'
import { useNetwork, useProvider, useAccount } from 'wagmi'
import { useBalanceReducer } from '../contexts/Balance'
import { balanceOf } from '../utils/contracts'
import Loading from './common/Loading'

const Balance = () => {
  const { chain } = useNetwork()
  const provider = useProvider()
  const { address } = useAccount()

  const { balance, setBalance } = useBalanceReducer()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (address && chain) {
      const fetchBalance = async () => {
        const balance = await balanceOf(chain.id, provider, address.toString())
        setBalance(balance)
        setLoading(false)
      }
      fetchBalance()
    }
  }, [chain, provider, address, setBalance])

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
