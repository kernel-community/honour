import React, { useState, useEffect, useContext } from 'react'
import { useWallet } from '../contexts/Wallet'
import { balanceOf, forgive } from '../utils/contracts'
import { QRReadContext } from '../contexts/QRRead'
import { AddressInput } from './Input/AdressInput'
import Tooltip from './common/ToolTip'
import QRReader from './common/QRReader'
import useError from '../hooks/useError'
import useLoading from '../hooks/useLoading'

import qrcode from '../images/qr-code.png'

function Forgive () {
  const { chainId, address, publicClient, getWalletClient } = useWallet()

  const { open: openLoading, close: closeLoading } = useLoading()
  const { open: openError } = useError()

  const [amount, setAmount] = useState('')
  const [validForm, setValidForm] = useState(false)
  // eslint-disable-next-line
  const [error, setError] = useState(null)

  const [display, setDisplay] = useState('')
  const { state, dispatch } = useContext(QRReadContext)

  useEffect(() => {
    setDisplay(state.forgiven)
  }, [state.forgiven])

  const handleAddress = (setAddress) => {
    if (address === setAddress) {
      setError("You can't forgive your own HON")
    } else {
      dispatch({ type: 'forgiven', payload: setAddress })
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

  async function handleForgive (e) {
    e.preventDefault()
    console.log("From handleForgiven: ", state.forgiven)
    const balance = await balanceOf(chainId, publicClient, state.forgiven)
    if (balance < amount) {
      openError('You are trying to forgive this account by more than their current balance, which is ' + parseFloat(balance) + '. Please decrease to this amount or less.')
    } else {
      openLoading('Please sign this transaction')

      // Call the forgive function with the inputted address and amount
      let tx
      try {
        const walletClient = await getWalletClient()
        if (!walletClient) {
          throw new Error('Wallet not connected')
        }
        tx = await forgive(state.forgiven, amount, chainId, walletClient, publicClient)
      } catch (err) {
        openError('There was an error. Please try again.')
        closeLoading()
        setError('Failed to submit transaction')
        return
      }

      openLoading('Making money weirder')

      await tx.wait(1)

      closeLoading()

      // Reset the form inputs
      setDisplay('')
      setAmount('')
    }
  }

  return (
    <div>
      <div className='flex md:text-4xl text-2xl flex-grow font-volkhorn text-gray-700 self-center'>
        Forgive
      </div>
      <form className='flex flex-col gap-4 p-4 bg-gray-100 rounded-md shadow-md'>
      <Tooltip text="Whom do you forgive?" tooltip="You can forgive any account, but you cannot forgive more HON than you hold, or more HON than is currently in the account you want to forgive." />
        <div className='relative'>
          <AddressInput
            value={display}
            name='forgiven'
            placeholder='Enter address or ENS name'
            onChange={handleAddress}
          />
          <div className='mt-2'>
            <button
              type='button'
              className='h-full px-3 text-gray-500 hover:text-gray-700'
              onClick={() => dispatch({ type: 'showForScanner' })}
            >
              Or scan a QR code
              <img src={qrcode} alt='Scan' className='h-8 float-left pr-2' />
            </button>
          </div>
        </div>
        {state.showForScanner && (
          <QRReader type='forgiven' />
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
          onClick={handleForgive}
          disabled={!validForm}
        >
          Forgive
        </button>
      </form>
      {error ? <p className='mt-4 text-red-500'>{error}</p> : <p>&nbsp;</p>}
    </div>
  )
}

export default Forgive
