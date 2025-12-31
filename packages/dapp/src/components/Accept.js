/* global BigInt */
import React, { useState, useEffect, useContext } from 'react'
import { useWallet } from '../contexts/Wallet'
import { useSmartAccount } from '../contexts/SmartAccount'
import { useFreeMode } from '../contexts/FreeMode'
import { formatUnits } from 'viem'
import { GraphQLClient, gql } from 'graphql-request'
import { graph } from '../utils/constants'
import { InspectContext } from '../contexts/Inspect'
import Tooltip from './common/ToolTip'

const HONOUR_SUBGRAPH_URL = graph.baseURL
const graphQLClient = new GraphQLClient(HONOUR_SUBGRAPH_URL)

function Accept () {
  const { address } = useWallet()
  const { smartAccountAddress } = useSmartAccount()
  const { freeMode } = useFreeMode()
  const { state, dispatch } = useContext(InspectContext)
  const [forgiveness, setForgiveness] = useState([])
  const [processedIds, setProcessedIds] = useState(new Set())

  // Use smart account address when freeMode is on, EOA when off
  const accountAddress = freeMode ? smartAccountAddress : address

  // Track processed IDs from context and immediately filter them out
  useEffect(() => {
    if (state.acceptedId) {
      setProcessedIds(prev => new Set(prev).add(state.acceptedId))
      // Immediately filter out the processed forgiveness
      setForgiveness(prev => prev.filter(forgive => forgive.forgivingId !== state.acceptedId))
    }
  }, [state.acceptedId])

  useEffect(() => {
    if (accountAddress) {
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
        const variables = { account: accountAddress.toString() }

        const [dataForgivens, dataAccepteds] = await Promise.all([
          graphQLClient.request(queryForgivens, variables),
          graphQLClient.request(queryAccepteds, variables)
        ])

        const forgivens = dataForgivens.forgivens
        const accepteds = dataAccepteds.accepteds

        // Filter out forgiveness that are accepted according to subgraph
        const filteredForgivens = forgivens.filter((forgiven) => {
          return !accepteds.some((accepted) => {
            return accepted.forgivingId === forgiven.forgivingId
          })
        })

        // Sort by timestamp, newest first
        const sortedForgivens = filteredForgivens.sort((a, b) => {
          return parseInt(b.blockTimestamp) - parseInt(a.blockTimestamp)
        })

        setForgiveness(sortedForgivens)
      }

      fetchData()
    }
  }, [accountAddress, state.acceptedId])

  return (
    <div className='mt-20'>
      <div className='flex md:text-4xl text-2xl flex-grow font-volkhorn text-gray-700 self-center'>
        <Tooltip position='right' text="Accept" tooltip="Below is all the HON others wish to forgive you. Inspect each before you accept it." />
      </div>
      <div className='grid grid-cols-[1.2fr_0.6fr_1.4fr_0.8fr] md:divide-x sm:divide-gray-200'>
        <div className='sm:col-span-1'>
          <div className='px-6 py-3 text-sm font-medium text-gray-500 uppercase tracking-wider'>
            Forgiver
          </div>
          {forgiveness.map((forgive) => (
            <div key={forgive.id} className='px-6 h-20 whitespace-nowrap border-b border-gray-200 flex items-center'>
              {`${forgive.forgiver.slice(0, 5)}...${forgive.forgiver.slice(-3)}`}
            </div>
          ))}
        </div>
        <div className='sm:col-span-1'>
          <div className='px-6 py-3 text-sm font-medium text-gray-500 uppercase tracking-wider'>
            Amount
          </div>
          {forgiveness.map((forgive) => (
            <div key={forgive.id} className='px-6 h-20 whitespace-nowrap border-b border-gray-200 flex items-center'>
              {(formatUnits(BigInt(forgive.amount), 18)).slice(0, 5)}
            </div>
          ))}
        </div>
        <div className='sm:col-span-1 hidden lg:block'>
          <div className='px-6 py-3 text-sm font-medium text-gray-500 uppercase tracking-wider'>
            Timestamp
          </div>
          {forgiveness.map((forgive) => {
            const date = new Date(parseInt(forgive.blockTimestamp) * 1000)
            const formattedDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' }) + ' ' + date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
            return (
              <div key={forgive.id} className='px-6 h-20 whitespace-nowrap border-b border-gray-200 flex items-center text-[10px]'>
                {formattedDate}
              </div>
            )
          })}
        </div>
        <div className='sm:col-span-1'>
          <div className='px-6 py-3 text-sm font-medium text-gray-500 uppercase tracking-wider'>
            Action
          </div>
          {forgiveness.map((forgive) => (
            <div key={forgive.id} className='px-6 h-20 whitespace-nowrap border-b border-gray-200 flex items-center'>
              <button
                className='w-full lg:px-4 py-2 text-white bg-[#233447] rounded-md hover:bg-indigo-700 focus:outline-none focus:ring focus:ring-indigo-500'
                onClick={() => dispatch({ type: 'accept', payload: { showModal: true, id: forgive.forgivingId, address: forgive.forgiver, amount: forgive.amount } })}
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

