import React, { useState } from 'react'
import { useNetwork, useSigner } from 'wagmi'
import { forgive } from '../utils/contracts'
import QrReader from 'react-qr-reader'
import useError from '../hooks/useError'
import useLoading from '../hooks/useLoading'

import qrcode from '../images/qr-code.png'

function Forgive () {
  const { chain } = useNetwork()
  const { data: signer } = useSigner()

  const { open: openLoading, close: closeLoading } = useLoading()
  const { open: openError } = useError()

  const [forgiven, setForgiven] = useState('')
  const [amount, setAmount] = useState('')
  const [showScanner, setShowScanner] = useState(false)
  const [validForm, setValidForm] = useState(false)
  // eslint-disable-next-line
  const [error, setError] = useState(null)

  const handleScan = async (scanData) => {
    if (scanData && scanData !== '') {
      setForgiven(scanData)
      setShowScanner(false)
    }
  }
  const handleError = (err) => {
    console.error(err)
  }

  const isValidEthereumAddress = (address) => {
    return /^(0x)?[0-9a-fA-F]{40}$/.test(address)
  };

  const handleInputChange = (e) => {
    const input = e.target.value;
    const name = e.target.name;
  
    if (name === 'forgiven') {
      setForgiven(input);
      if (!isValidEthereumAddress(input)) {
        setError('Please enter a valid Ethereum address')
        setValidForm(false)
      } else {
        setError('')
      }
    } else if (name === 'amount') {
      const amountNum = Number(input);
      if (isNaN(amountNum) || amountNum <= 0) {
        setError('Please enter a valid amount greater than 0')
        setValidForm(false)
      } else {
        setError('')
      }
      setAmount(input)

      const isAmountValid = !isNaN(amount)
      const isReceiverValid = isValidEthereumAddress(forgiven)
      setValidForm(isAmountValid && isReceiverValid)
    }
  };

  async function handleForgive (e) {
    e.preventDefault()
    openLoading('Please sign this transaction')

    // Call the forgive function with the inputted address and amount
    let tx
    try {
      tx = await forgive(forgiven, amount, chain.id, signer)
    } catch (err) {
      console.log(err)
      openError('There was an error. Please try again.')
      console.log(err)
      closeLoading()
      setError('Failed to submit transaction')
      return
    }

    openLoading('Waiting for money to get weirder')

    await tx.wait(1)

    closeLoading()

    // Reset the form inputs

    // Reset the form inputs
    setForgiven('')
    setAmount('')
  }

  return (
    <div>
      <div className='flex md:text-4xl text-2xl flex-grow font-volkhorn text-gray-700 self-center'>
        Forgive
      </div>
      <form className='flex flex-col gap-4 p-4 bg-gray-100 rounded-md shadow-md'>
        <label htmlFor='receiver' className='text-gray-800'>
          Whom do you forgive?
        </label>
        <div className='relative'>
          <input
            type='text'
            id='forgiven'
            name='forgiven'
            value={forgiven}
            onChange={handleInputChange}
            className='w-full px-4 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-500'
          />
          <button
            type='button'
            className='absolute right-0 h-full px-3 text-gray-500 hover:text-gray-700'
            onClick={() => setShowScanner(true)}
          >
            <img src={qrcode} alt='Scan' className='h-8' />
          </button>
        </div>
        {showScanner && (
          <QrReader
            onScan={handleScan}
            onError={handleError}
            style={{ width: '300px', marginBottom: '1rem' }}
          />
        )}
        <label htmlFor='amount' className='text-gray-800'>
          Amount
        </label>
        <input
          type='text'
          id='amount'
          name='amount'
          value={amount}
          onChange={handleInputChange}
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
      {error && <p className='mt-4 text-red-500'>{error}</p>}
    </div>
  )
}

export default Forgive
