import { useState, useContext } from 'react'
import { InspectContext } from '../../contexts/Inspect'
import { honour, accept, extractErrorDetails } from '../../utils/contracts'
import { useWallet } from '../../contexts/Wallet'
import { useSmartAccount } from '../../contexts/SmartAccount'
import { useFreeMode } from '../../contexts/FreeMode'
import useSuccess from '../../hooks/useSuccess'
import useError from '../../hooks/useError'

import Spinner from '../common/Spinner'

const Transact = () => {
  const { state, dispatch } = useContext(InspectContext)
  const { chainId, getWalletClient, publicClient } = useWallet()
  const { smartAccountClient, isInitialized: smartAccountReady } = useSmartAccount()
  const { freeMode } = useFreeMode()
  const { open: openSuccess } = useSuccess()
  const { open: openError } = useError()

  const [loading, setLoading] = useState(false)
  // eslint-disable-next-line
  const [error, setError] = useState(null)

  const honourTx = async (proposer, id) => {
    setLoading(true)
    dispatch({ type: 'confirming' })
    let tx
    try {
      // Use smart account client when freeMode is on, EOA wallet client when off
      const client = freeMode && smartAccountReady && smartAccountClient 
        ? smartAccountClient 
        : await getWalletClient()
      if (!client) {
        throw new Error('Wallet not connected')
      }
      if (!publicClient) {
        throw new Error('Public client not initialized')
      }
      tx = await honour(proposer, id, chainId, client, publicClient)
    } catch (err) {
      setLoading(false)
      const errorMessage = err?.message || 'Unknown error'
      const details = extractErrorDetails(errorMessage)
      openError(`There was an error: ${details}`)
      setError(`Failed to submit transaction: ${details}`)
      return
    }
    
    try {
      await tx.wait(1)
      setLoading(false)
      dispatch({ type: 'honourEvent', payload: { honouredId: id } })
      dispatch({ type: 'hideModal' })
      dispatch({ type: 'confirmed' })
      // Wait for modal to close before showing success
      setTimeout(() => {
        openSuccess('Transaction successful!', tx.hash)
      }, 300)
    } catch (err) {
      setLoading(false)
      openError('Transaction submitted but failed to confirm')
      setError('Transaction may have failed')
    }
  }

  const acceptTx = async (forgiver, id) => {
    setLoading(true)
    dispatch({ type: 'confirming' })
    let tx
    try {
      // Use smart account client when freeMode is on, EOA wallet client when off
      const client = freeMode && smartAccountReady && smartAccountClient 
        ? smartAccountClient 
        : await getWalletClient()
      if (!client) {
        throw new Error('Wallet not connected')
      }
      if (!publicClient) {
        throw new Error('Public client not initialized')
      }
      tx = await accept(forgiver, id, chainId, client, publicClient)
    } catch (err) {
      setLoading(false)
      const errorMessage = err?.message || 'Unknown error'
      const details = extractErrorDetails(errorMessage)
      openError(`There was an error: ${details}`)
      setError(`Failed to submit transaction: ${details}`)
      return
    }
    
    try {
      await tx.wait(1)
      setLoading(false)
      dispatch({ type: 'acceptEvent', payload: { acceptedId: id } })
      dispatch({ type: 'hideModal' })
      dispatch({ type: 'confirmed' })
      // Wait for modal to close before showing success
      setTimeout(() => {
        openSuccess('Transaction successful!', tx.hash)
      }, 300)
    } catch (err) {
      setLoading(false)
      openError('Transaction submitted but failed to confirm')
      setError('Transaction may have failed')
    }
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
