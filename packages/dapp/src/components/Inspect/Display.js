import { useState, useEffect, useContext } from 'react'
import { useProvider, useAccount, useNetwork } from 'wagmi'
import { ethers } from 'ethers'
import { useBalanceReducer } from '../../contexts/Balance'
import { InspectContext } from '../../contexts/Inspect'
import { balanceOf } from '../../utils/contracts'

import useInspectTransactions from '../../hooks/useInspectTransactions'

const Display = () => {
    const { address } = useAccount()
    const { chain } = useNetwork()
    const provider = useProvider()
    const { state } = useContext(InspectContext)
    // This is so we can inspect the balance of the address the person is interacting with
    const [balanceIns, setBalanceIns] = useState('')
    // This is so we can display the change to their balance the interaction will have
    const { balance } = useBalanceReducer()
    const inspector = address
    const [allTransactions, trustScore] = useInspectTransactions(state.address, inspector)
    const transactions = allTransactions.slice(0, 8)

    useEffect(() => {
        if (state.address && chain) {
            const fetchBalanceIns = async () => {
            const balanceIns = await balanceOf(chain.id, provider, state.address.toString())
            setBalanceIns(balanceIns)
            }
            fetchBalanceIns()
        }
    }, [chain, provider, state.address])

    const truncateString = (str, maxLen) => {
        if (str.length <= maxLen) return str
        const start = str.slice(0, 8)
        const end = str.slice(-5)
        return `${start}...${end}`
    }
    const truncatedAddress = truncateString(state.address, 8)

    const calcBalanceChange = (balance, amount, kind) => {
        if (kind === 'honour') {
            return (parseFloat(balance) + parseFloat(amount))
        } else {
            return (parseFloat(balance) - parseFloat(amount))
        }
    }

    const acceptBalance = calcBalanceChange(balance, ethers.utils.formatUnits(state.amount, 18), 'accept')
    const honourBalance = calcBalanceChange(balance, ethers.utils.formatUnits(state.amount, 18), 'honour')

    return (
        <div className='w-full h-full p-2'>
          <div className='text-2xl my-2'>
            Take Care
          </div>
          <div className='my-4 text-xl'>
            Your are about to interact with: <strong>{truncatedAddress}</strong>,<br/>
            who wants&nbsp;
            {state.button === 'accept' ? 
            <span>
              to forgive you <strong>{ethers.utils.formatUnits(state.amount, 18)} HON</strong>.<br/>
              This will <strong className='text-green-500'>decrease</strong> your HON balance to&nbsp;
              <strong className='text-green-500'>{acceptBalance}</strong>
            </span>
            :
            <span>
              you to take on an additional <strong>{ethers.utils.formatUnits(state.amount, 18)} HON</strong>.<br/>
              This will <strong className='text-red-500'>increase</strong> your HON balance to&nbsp;
              <strong className='text-red-500'>{honourBalance}</strong>
            </span>
            }
          </div>
          <hr />
          <div className='grid grid-cols-2 my-4'>
            <div className='sm:col-span-1 text-center'>
              This account has obligations of:
              <div className='text-4xl text-bold mt-2'>
                {balanceIns.slice(0,5)}
              </div>
            </div>
            <div className='sm:col-span-1'>
              <div className='sm:col-span-1 text-center'>
                This account has a trust score of:
                <div className={`text-4xl text-bold mt-2 ${
                  trustScore < 3 ? 'text-red-500' : trustScore >= 4 && trustScore <= 9 ? 'text-yellow-500' : 'text-green-500'
                }`}>
                  {trustScore}
                </div>
              </div>
            </div>
          </div>
          <hr />
          <div className='my-4'>
            Recent transactions from this account:
          </div>
          <div className='grid grid-cols-3 sm:divide-x sm:divide-gray-200'>
          <div className='sm:col-span-1'>
            <div className='px-4 py-2 text-sm font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200'>
              Type
            </div>
            {transactions.map((transaction) => (
              <div key={transaction.id} className='px-4 py-1 whitespace-nowrap border-b border-gray-200'>
                {transaction.type}
              </div>
            ))}
          </div>
          <div className='sm:col-span-1'>
            <div className='px-4 py-2 text-sm font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200'>
              With
            </div>
            {transactions.map((transaction) => (
              <div key={transaction.id} className='px-4 py-1 whitespace-nowrap border-b border-gray-200'>
                {`${transaction.with.slice(0, 5)}...${transaction.with.slice(-3)}`}
              </div>
            ))}
          </div>
          <div className='sm:col-span-1'>
            <div className='px-4 py-2 text-sm font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200'>
              Amount
            </div>
            {transactions.map((transaction) => (
              <div key={transaction.id} className='px-4 py-1 whitespace-nowrap border-b border-gray-200'>
                {ethers.utils.formatUnits(transaction.amount, 18)}
              </div>
            ))}
          </div>
        </div>
        </div>
    )
} 

export default Display