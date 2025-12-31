import React, { useState, useEffect, useContext } from 'react'
import { useWallet } from '../contexts/Wallet'
import { useSmartAccount } from '../contexts/SmartAccount'
import { useFreeMode } from '../contexts/FreeMode'
import { propose, extractErrorDetails } from '../utils/contracts'
import { resolveToSmartAccountAddress } from '../utils/smartAccount'
import { QRReadContext } from '../contexts/QRRead'
import { AddressInput } from './Input/AdressInput'
import QRReader from './common/QRReader'
import Tooltip from './common/ToolTip'
import useError from '../hooks/useError'
import useLoading from '../hooks/useLoading'
import useSuccess from '../hooks/useSuccess'

import qrcode from '../images/qr-code.png'

function Propose () {
  const { chainId, address, getWalletClient, publicClient } = useWallet()
  const { smartAccountClient, smartAccountAddress, isInitialized: smartAccountReady } = useSmartAccount()
  const { freeMode } = useFreeMode()

  const { open: openLoading, close: closeLoading } = useLoading()
  const { open: openError } = useError()
  const { open: openSuccess } = useSuccess()

  const [display, setDisplay] = useState('')

  const [amount, setAmount] = useState('')
  const [validForm, setValidForm] = useState(false)
  // eslint-disable-next-line
  const [error, setError] = useState(null)

  const { state, dispatch } = useContext(QRReadContext)

  // Displays the address if it comes from a QR scan
  useEffect(() => {
    setDisplay(state.recipient)
  }, [state.recipient])

  const handleAddress = (setAddress) => {
    if (address === setAddress) {
      setError("You can't propose HON to yourself")
    } else {
      dispatch({ type: 'recipient', payload: setAddress })
      setDisplay(setAddress)
    }
  }

  const handleAmount = (event) => {
    const amountNum = Number(event.target.value)
    if (isNaN(amountNum) || amountNum <= 0) {
      setError('Please enter a valid amount greater than 0')
      setValidForm(false)
    } else {
      setError('')
    }
    setAmount(event.target.value)
    const isAmountValid = !isNaN(amount)
    setValidForm(isAmountValid)
  }

  async function handlePropose (e) {
    e.preventDefault()

    openLoading('Please sign this transaction')

    // Resolve recipient address to smart account address only when freeMode is on
    const recipientSmartAccount = freeMode
      ? await resolveToSmartAccountAddress(
          state.recipient,
          address,
          smartAccountAddress
        )
      : state.recipient

    // Call the propose function with the inputted address and amount
    let tx
    try {
      // When freeMode is off, always use regular wallet client (no smart account)
      // When freeMode is on, use smart account client if available
      let client
      if (freeMode && smartAccountReady && smartAccountClient) {
        client = smartAccountClient
      } else {
        client = await getWalletClient()
      }
      
      if (!client) {
        throw new Error('Wallet not connected')
      }
      if (!publicClient) {
        throw new Error('Public client not initialized')
      }
      tx = await propose(recipientSmartAccount, amount, chainId, client, publicClient)
    } catch (err) {
      const errorMessage = err?.message || 'Unknown error'
      const details = extractErrorDetails(errorMessage)
      closeLoading()
      openError(`There was an error: ${details}`)
      setError(`Failed to submit transaction: ${details}`)
      return
    }

    openLoading('Making money weirder')

    try {
      await tx.wait(1)
      
      // Open success modal first, then close loading to avoid flash
      openSuccess('Transaction successful!', tx.hash)
      // Close loading in next tick to ensure smooth transition
      setTimeout(() => {
        closeLoading()
      }, 0)
      
      // Reset the form inputs
      setDisplay('')
      setAmount('')
      setError(null)
    } catch (err) {
      closeLoading()
      openError('Transaction submitted but failed to confirm')
      setError('Transaction may have failed')
      return
    }
  }

  return (
    <div>
      <div className='flex md:text-4xl text-2xl flex-grow font-volkhorn text-gray-700 self-center'>
          Propose
      </div>
      <form className='flex flex-col gap-4 p-4 bg-gray-100 rounded-md shadow-md'>
        <Tooltip text="Whom do you oblige?" tooltip="You can propose HON to any account. Start here by putting in an account you wish to take on HON tokens." />
        <div className='relative'>
          <AddressInput
            value={display}
            name='recipient'
            placeholder='Enter address or ENS name' 
            onChange={handleAddress}
          />
          <div className='mt-2'>
            <button
              type='button'
              className='h-full px-3 text-gray-500 hover:text-gray-700'
              onClick={() => dispatch({ type: 'showPropScanner' })}
            >
              Or scan a QR code
              <img src={qrcode} alt='Scan' className='h-8 float-left pr-2' />
            </button>
          </div>
        </div>
        {state.showPropScanner && (
          <QRReader type='recipient' />
        )}
        <label htmlFor='amount' className='text-gray-800'>
          Amount
        </label>
        <input
          type='text'
          id='amount'
          name='amount'
          autoComplete='off'
          value={amount}
          onChange={handleAmount}
          className='w-full px-4 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-500'
        />
        <button
          type='submit'
          className={`w-1/2 px-4 py-2 mx-auto text-white rounded-md focus:outline-none focus:ring ${
            validForm ? 'bg-[#233447] hover:bg-indigo-700 focus:ring-indigo-500' : 'bg-gray-300 cursor-not-allowed'
          }`}
          onClick={handlePropose}
          disabled={!validForm}
        >
          Propose
        </button>
      </form>
      {error ? <p className='mt-4 text-red-500'>{error}</p> : <p>&nbsp;</p>}
    </div>
  )
}

export default Propose
