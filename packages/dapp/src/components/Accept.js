import React, { useState, useEffect } from 'react'
import { useNetwork, useAccount, useSigner } from 'wagmi'
import { ethers } from 'ethers'
import { GraphQLClient, gql } from 'graphql-request'

import { accept } from '../utils/contracts'
import useError from '../hooks/useError'
import useLoading from '../hooks/useLoading'
import { graph } from '../utils/constants'

const HONOUR_SUBGRAPH_URL = graph.baseURL
const graphQLClient = new GraphQLClient(HONOUR_SUBGRAPH_URL)

function Accept () {
  const { chain } = useNetwork()
  const { address } = useAccount()
  const { data: signer } = useSigner()

  const [forgiveness, setForgiveness] = useState([])

  const { open: openLoading, close: closeLoading } = useLoading()
  const { open: openError } = useError()

  // eslint-disable-next-line
    const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchData () {
      const queryForgivens = gql`
            query GetForgivens($account: Bytes!) {
              forgivens(where: { forgiven: $account }) {
                id
                forgiver
                amount
                blockNumber
                blockTimestamp
                transactionHash
              }
            }
          `

      const variables = { account: address.toString() }
      const dataForgivens = await graphQLClient.request(queryForgivens, variables)

      // Get the array of forgiveness
      const forgiveness = dataForgivens.forgivens

      // Set the proposals state to the array of forgiveness
      setForgiveness(forgiveness)
    }

    fetchData()
  }, [address])

  const acceptance = async (forgiver) => {
    openLoading('Please sign this transaction')

    // Call the propose function with the inputted address and amount
    let tx
    try {
      tx = await accept(forgiver, chain.id, signer)
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
  }

  return (
    <div className='mt-20'>
      <div className='flex md:text-4xl text-2xl flex-grow font-volkhorn text-gray-700 self-center'>
        Accept
      </div>
      <div className='grid grid-cols-3 lg:grid-cols-4 md:divide-x sm:divide-gray-200'>
        <div className='sm:col-span-1'>
          <div className='px-6 py-3 text-sm font-medium text-gray-500 uppercase tracking-wider'>
            Forgiver
          </div>
          {forgiveness.map((forgive) => (
            <div key={forgive.id} className='px-6 py-6 whitespace-nowrap border-b border-gray-200'>
              {`${forgive.forgiver.slice(0, 5)}...${forgive.forgiver.slice(-3)}`}
            </div>
          ))}
        </div>
        <div className='sm:col-span-1'>
          <div className='px-6 py-3 text-sm font-medium text-gray-500 uppercase tracking-wider'>
            Amount
          </div>
          {forgiveness.map((forgive) => (
            <div key={forgive.id} className='px-6 py-6 whitespace-nowrap border-b border-gray-200'>
              {ethers.utils.formatUnits(forgive.amount, 18)}
            </div>
          ))}
        </div>
        <div className='sm:col-span-1 hidden lg:block'>
          <div className='px-6 py-3 text-sm font-medium text-gray-500 uppercase tracking-wider'>
            Timestamp
          </div>
          {forgiveness.map((forgive) => (
            <div key={forgive.id} className='px-6 py-6 whitespace-nowrap border-b border-gray-200'>
              {new Date(parseInt(forgive.blockTimestamp) * 1000).toLocaleString()}
            </div>
          ))}
        </div>
        <div className='sm:col-span-1'>
          <div className='px-6 py-3 text-sm font-medium text-gray-500 uppercase tracking-wider'>
            Action
          </div>
          {forgiveness.map((forgive) => (
            <div key={forgive.id} className='px-6 py-4 whitespace-nowrap border-b border-gray-200'>
              <button
                className='w-full lg:px-4 py-2 text-white bg-[#233447] rounded-md hover:bg-indigo-700 focus:outline-none focus:ring focus:ring-indigo-500'
                onClick={() => acceptance(forgive.forgiver)}
              >
                Accept
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Accept
