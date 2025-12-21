/* global BigInt */
import React, { useState, useEffect, useContext } from 'react'
import { useWallet } from '../contexts/Wallet'
import { formatUnits } from 'viem'
import { InspectContext } from '../contexts/Inspect'
import { GraphQLClient, gql } from 'graphql-request'
import { graph } from '../utils/constants'
import Tooltip from './common/ToolTip'

const HONOUR_SUBGRAPH_URL = graph.baseURL
const graphQLClient = new GraphQLClient(HONOUR_SUBGRAPH_URL)

function Honour () {
  const { address } = useWallet()
  const { state, dispatch } = useContext(InspectContext)

  const [proposals, setProposals] = useState([])

  useEffect(() => {
    if (address) {
      async function fetchData () {
        const queryProposals = gql`
            query GetProposals($account: Bytes!) {
                proposeds(where: { receiver: $account }) {
                    id
                    proposer
                    proposalId
                    amount
                    blockTimestamp
                }
            }
        `
        const queryHonoureds = gql`
            query GetHonoureds($account: Bytes!) {
                honoureds(where: { receiver: $account }) {
                    proposalId
                }
            }
        `
        const variables = { account: address.toString() }

        const [dataProposals, dataHonoureds] = await Promise.all([
          graphQLClient.request(queryProposals, variables),
          graphQLClient.request(queryHonoureds, variables)
        ])

        // Get the array of proposals and honoured proposals
        const proposeds = dataProposals.proposeds
        const honoureds = dataHonoureds.honoureds

        // Filter out the proposals that have already been honoured
        const filteredProposals = proposeds.filter((proposal) => {
          return !honoureds.some((honoured) => {
            return (
              honoured.proposalId === proposal.proposalId &&
                proposal.proposalId !== state.honouredId
            )
          })
        })

        // Sort by timestamp, newest first
        const sortedProposals = filteredProposals.sort((a, b) => {
          return parseInt(b.blockTimestamp) - parseInt(a.blockTimestamp)
        })

        // Set the proposals state to the sorted array of proposals
        setProposals(sortedProposals)
      }

      fetchData()
    }
  }, [address, state.honouredId])

  return (
    <div className='mt-20'>
      <div className='flex md:text-4xl text-2xl flex-grow font-volkhorn text-gray-700 self-center'>
        <Tooltip position='right' text="Honour" tooltip="Below is all the HON others have proposed to you. Inspect each before you honour it." />
      </div>
      <div className='grid grid-cols-3 lg:grid-cols-4 sm:divide-x sm:divide-gray-200'>
        <div className='sm:col-span-1'>
          <div className='px-6 py-3 text-sm font-medium text-gray-500 uppercase tracking-wider'>
            Proposer
          </div>
          {proposals.map((proposal) => (
            <div key={proposal.id} className='px-6 h-20 whitespace-nowrap border-b border-gray-200 flex items-center'>
              {`${proposal.proposer.slice(0, 5)}...${proposal.proposer.slice(-3)}`}
            </div>
          ))}
        </div>
        <div className='sm:col-span-1'>
          <div className='px-6 py-3 text-sm font-medium text-gray-500 uppercase tracking-wider'>
            Amount
          </div>
          {proposals.map((proposal) => (
            <div key={proposal.id} className='px-6 h-20 whitespace-nowrap border-b border-gray-200 flex items-center'>
              {(formatUnits(BigInt(proposal.amount), 18)).slice(0, 5)}
            </div>
          ))}
        </div>
        <div className='sm:col-span-1 hidden lg:block'>
          <div className='px-6 py-3 text-sm font-medium text-gray-500 uppercase tracking-wider'>
            Timestamp
          </div>
          {proposals.map((proposal) => {
            const date = new Date(parseInt(proposal.blockTimestamp) * 1000)
            const formattedDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' }) + ' ' + date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
            return (
              <div key={proposal.id} className='px-6 h-20 whitespace-nowrap border-b border-gray-200 flex items-center text-[10px]'>
                {formattedDate}
              </div>
            )
          })}
        </div>
        <div className='sm:col-span-1'>
          <div className='px-6 py-3 text-sm font-medium text-gray-500 uppercase tracking-wider'>
            Action
          </div>
          {proposals.map((proposal) => (
            <div key={proposal.id} className='px-6 h-20 whitespace-nowrap border-b border-gray-200 flex items-center'>
              <button
                className='w-full lg:px-4 py-2 text-white bg-[#233447] rounded-md hover:bg-indigo-700 focus:outline-none focus:ring focus:ring-indigo-500'
                onClick={() => dispatch({ type: 'honour', payload: { showModal: true, id: proposal.proposalId, address: proposal.proposer, amount: proposal.amount } })}
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

export default Honour
