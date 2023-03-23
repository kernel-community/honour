import React, { useState, useEffect, useContext } from 'react'
import { useAccount } from 'wagmi'
import { ethers } from 'ethers'
import { InspectContext } from '../contexts/Inspect'
import { GraphQLClient, gql } from 'graphql-request'
import { graph } from '../utils/constants'

const HONOUR_SUBGRAPH_URL = graph.baseURL
const graphQLClient = new GraphQLClient(HONOUR_SUBGRAPH_URL)

function Honour () {
  const { address } = useAccount()
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

        // Set the proposals state to the filtered array of proposals
        setProposals(filteredProposals)
      }

      fetchData()
    }
  }, [address, state.honouredId])

  return (
    <div className='mt-20'>
      <div className='flex md:text-4xl text-2xl flex-grow font-volkhorn text-gray-700 self-center'>
        Honour
      </div>
      <div className='grid grid-cols-3 lg:grid-cols-4 sm:divide-x sm:divide-gray-200'>
        <div className='sm:col-span-1'>
          <div className='px-6 py-3 text-sm font-medium text-gray-500 uppercase tracking-wider'>
            Proposer
          </div>
          {proposals.map((proposal) => (
            <div key={proposal.id} className='px-6 py-6 whitespace-nowrap border-b border-gray-200'>
              {`${proposal.proposer.slice(0, 5)}...${proposal.proposer.slice(-3)}`}
            </div>
          ))}
        </div>
        <div className='sm:col-span-1'>
          <div className='px-6 py-3 text-sm font-medium text-gray-500 uppercase tracking-wider'>
            Amount
          </div>
          {proposals.map((proposal) => (
            <div key={proposal.id} className='px-6 py-6 whitespace-nowrap border-b border-gray-200'>
              {(ethers.utils.formatUnits(proposal.amount, 18)).slice(0, 5)}
            </div>
          ))}
        </div>
        <div className='sm:col-span-1 hidden lg:block'>
          <div className='px-6 py-3 text-sm font-medium text-gray-500 uppercase tracking-wider'>
            Timestamp
          </div>
          {proposals.map((proposal) => (
            <div key={proposal.id} className='px-6 py-6 whitespace-nowrap border-b border-gray-200'>
              {new Date(parseInt(proposal.blockTimestamp) * 1000).toLocaleString()}
            </div>
          ))}
        </div>
        <div className='sm:col-span-1'>
          <div className='px-6 py-3 text-sm font-medium text-gray-500 uppercase tracking-wider'>
            Action
          </div>
          {proposals.map((proposal) => (
            <div key={proposal.id} className='px-6 py-4 whitespace-nowrap border-b border-gray-200'>
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
