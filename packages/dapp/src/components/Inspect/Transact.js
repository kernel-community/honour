import { useState, useContext } from 'react'
import { InspectContext } from '../../contexts/Inspect'
import { honour, accept } from '../../utils/contracts'
import { useWallet } from '../../contexts/Wallet'

import Spinner from '../common/Spinner'

const Transact = () => {
  const { state, dispatch } = useContext(InspectContext)
  const { chainId, getWalletClient, publicClient } = useWallet()

  const [loading, setLoading] = useState(false)
  // eslint-disable-next-line
    const [error, setError] = useState(null)
  const honourTx = async (proposer, id) => {
    setLoading(true)
    dispatch({ type: 'confirming' })
    let tx
    try {
      const walletClient = await getWalletClient()
      if (!walletClient) {
        throw new Error('Wallet not connected')
      }
      tx = await honour(proposer, id, chainId, walletClient, publicClient)
    } catch (err) {
      setLoading(false)
      setError('Failed to submit transaction')
      return
    }
    await tx.wait(1)
    dispatch({ type: 'honourEvent', payload: { honouredId: id } })
    dispatch({ type: 'hideModal' })
    dispatch({ type: 'confirmed' })
  }

  const acceptTx = async (forgiver, id) => {
    setLoading(true)
    dispatch({ type: 'confirming' })
    let tx
    try {
      const walletClient = await getWalletClient()
      if (!walletClient) {
        throw new Error('Wallet not connected')
      }
      tx = await accept(forgiver, id, chainId, walletClient, publicClient)
    } catch (err) {
      setLoading(false)
      setError('Failed or rejected transaction')
      return
    }
    await tx.wait(1)
    dispatch({ type: 'acceptEvent', payload: { acceptedId: id } })
    dispatch({ type: 'hideModal' })
    dispatch({ type: 'confirmed' })
  }
  return (
    <div className='px-6 py-4 whitespace-nowrap w-3/4 lg:w-1/2'>
      {state.button === 'accept'
        ? (
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
          )
        : (
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
          )}
    </div>
  )
}

export default Transact
