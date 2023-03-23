import React, { useState, useEffect, useContext } from 'react'
import { useAccount } from 'wagmi'
import { ethers } from 'ethers'
import { GraphQLClient, gql } from 'graphql-request'
import { graph } from '../utils/constants'
import { InspectContext } from '../contexts/Inspect'

const HONOUR_SUBGRAPH_URL = graph.baseURL
const graphQLClient = new GraphQLClient(HONOUR_SUBGRAPH_URL)

function Accept () {
  const { address } = useAccount()
  const { state, dispatch } = useContext(InspectContext)
  const [forgiveness, setForgiveness] = useState([])

  useEffect(() => {
    if (address) {
        async function fetchData () {
        const queryForgivens = gql`
            query GetForgivens($account: Bytes!) {
                forgivens(where: { forgiven: $account }) {
                    id
                    forgiver
                    forgivingId
                    amount
                    blockTimestamp
                }
            }
        `
        const queryAccepteds = gql`
            query getAccepteds($account: Bytes!) {
                accepteds(where: { forgiven: $account }) {
                    forgivingId
                }
            }
        `
        const variables = { account: address.toString() }

        const [dataForgivens, dataAccepteds] = await Promise.all([
            graphQLClient.request(queryForgivens, variables),
            graphQLClient.request(queryAccepteds, variables)
        ])

        // Get the array of forgiveness
        const forgivens = dataForgivens.forgivens
        const accepteds = dataAccepteds.accepteds

        // Filter out the forgivens that have already been accepteded
        const filteredForgivens = forgivens.filter((forgiven) => {
            return !accepteds.some((accepted) => {
            return (
                accepted.forgivingId === forgiven.forgivingId &&
                forgiven.forgivingId !== state.acceptedId
            )
            })
        })

        // Set the proposals state to the array of forgiveness
        setForgiveness(filteredForgivens)
        }

        fetchData()
    }
  }, [address, state.acceptedId])

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
              {(ethers.utils.formatUnits(forgive.amount, 18)).slice(0,5)}
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
                onClick={() => dispatch({ type: 'accept', payload: {showModal: true, id: forgive.forgivingId, address: forgive.forgiver, amount: forgive.amount } })}
              >
                Inspect
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Accept
