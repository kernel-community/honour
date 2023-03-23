import { InspectContext } from '../contexts/Inspect'
import { useState, useEffect, useContext } from 'react'
import { useNetwork, useProvider, useSigner, useAccount } from 'wagmi'
import { ethers } from 'ethers'
import { balanceOf, honour, accept } from '../utils/contracts'

import CloseButton from './common/CloseButton'
import Spinner from './common/Spinner'
import useInspectTransactions from '../hooks/useInspectTransactions'
import Modal from '../layouts/Modal'

const InspectModal = () => {
  const { state, dispatch } = useContext(InspectContext)
  const { chain } = useNetwork()
  const { address } = useAccount()
  const provider = useProvider()
  const { data: signer } = useSigner()
  // We can't use the balanceReducer here as it is set up for the currently connected account
  // not the account we are interacting with, whose balance we want to find out now
  const [balance, setBalance] = useState('')

  const [loading, setLoading] = useState(false);
  // eslint-disable-next-line
  const [error, setError] = useState(null)

  const inspector = address

  const [allTransactions, trustScore] = useInspectTransactions(state.address, inspector);
  const transactions = allTransactions.slice(0, 8);

  useEffect(() => {
    if (state.address && chain) {
      const fetchBalance = async () => {
        const balance = await balanceOf(chain.id, provider, state.address.toString())
        setBalance(balance)
      }
      fetchBalance()
    }
  }, [chain, provider, state.address])

  const truncateString = (str, maxLen) => {
    if (str.length <= maxLen) return str
    const start = str.slice(0, 8)
    const end = str.slice(-5)
    return `${start}...${end}`
  }
  const truncatedAddress = truncateString(state.address, 8)

  const honourTx = async (proposer, id) => {
    setLoading(true);
    let tx
    try {
      tx = await honour(proposer, id, chain.id, signer)
    } catch (err) {
      setLoading(false)
      setError('Failed to submit transaction')
      return
    }
    await tx.wait(1)
    dispatch({ type: 'honourEvent', payload: { honouredId: id } })
    dispatch({ type: 'hideModal' })
  }

  const acceptTx = async (forgiver, id) => {
    setLoading(true);
    let tx
    try {
      tx = await accept(forgiver, id, chain.id, signer)
    } catch (err) {
      setLoading(false);
      setError('Failed or rejected transaction')
      return
    }
    await tx.wait(1)
    dispatch({ type: 'acceptEvent', payload: { acceptedId: id } })
    dispatch({ type: 'hideModal' })
  }

  if (!state.modal) return
  return (
    <Modal bringToFront>
      <div className='md:p-8 w-full h-min-content md:w-3/4 my-auto rounded-lg shadow-xl bg-white font-volkhorn flex flex-col items-center py-6 sm:py-0'>
        <div className='self-end'>
          <CloseButton exec={() => dispatch({ type: 'close' })} />
        </div>
        <div className='w-full h-full p-2'>
          <div className='text-2xl my-2'>
            Take Care
          </div>
          <div className='my-4 text-xl'>
            Your are about to interact with: <strong>{truncatedAddress}</strong>,<br/>
            who wants&nbsp;
            {state.button === 'accept' ? 
            <span>to forgive you <strong>{ethers.utils.formatUnits(state.amount, 18)}</strong>, which will <strong>decrease</strong> your HON balance.</span>
            :
            <span>you to take on an additional <strong>{ethers.utils.formatUnits(state.amount, 18)} HON</strong>.</span>
            }
          </div>
          <hr />
          <div className='grid grid-cols-2 my-4'>
            <div className='sm:col-span-1 text-center'>
              This account has obligations of:
              <div className='text-4xl text-bold mt-2'>
                {balance.slice(0,5)}
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
        {state.button === 'accept' ?
        <div className='px-6 py-4 whitespace-nowrap border-b border-gray-200'>
          <button
              className='w-full lg:px-4 py-2 text-white bg-[#233447] rounded-md hover:bg-indigo-700 focus:outline-none focus:ring focus:ring-indigo-500'
              onClick={() => acceptTx(state.address, state.id)}
              disabled={loading}
              style={{ position: 'relative' }}
            >
              {loading && (
                <Spinner />
              )}
            <span>{loading ? 'Confirming' : 'Accept'}</span>
          </button>
        </div>
        :
        <div className='px-6 py-4 whitespace-nowrap border-b border-gray-200'>
          <button
              className='w-full lg:px-4 py-2 text-white bg-[#233447] rounded-md hover:bg-indigo-700 focus:outline-none focus:ring focus:ring-indigo-500'
              onClick={() => honourTx(state.address, state.id)}
              disabled={loading}
              style={{ position: 'relative' }}
            >
              {loading && (
                <Spinner />
              )}
            <span>{loading ? 'Confirming' : 'Honour'}</span>
          </button>
        </div>
      }
      </div>
      </div>
    </Modal>
  )
}

export default InspectModal