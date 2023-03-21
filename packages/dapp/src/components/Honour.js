import React, { useState, useEffect } from 'react'
import { useNetwork, useAccount, useSigner } from 'wagmi'
import { ethers } from 'ethers'
import { GraphQLClient, gql } from 'graphql-request'

import { honour } from '../utils/contracts'
import useError from '../hooks/useError'
import useLoading from '../hooks/useLoading'
import { graph } from '../utils/constants'

const HONOUR_SUBGRAPH_URL = graph.baseURL
const graphQLClient = new GraphQLClient(HONOUR_SUBGRAPH_URL)

function Honour () {
  const { chain } = useNetwork()
  const { address } = useAccount()
  const { data: signer } = useSigner()

  const [proposals, setProposals] = useState([])

  const { open: openLoading, close: closeLoading } = useLoading()
  const { open: openError } = useError()

  // eslint-disable-next-line
    const [error, setError] = useState(null)

  useEffect(() => {
    if (address) {
        async function fetchData () {
        const queryProposals = gql`
                query GetProposals($account: Bytes!) {
                proposeds(where: { receiver: $account }) {
                    id
                    proposer
                    amount
                    blockNumber
                    blockTimestamp
                    transactionHash
                }
                }
            `

        const queryHonoureds = gql`
                query GetHonoureds($account: Bytes!) {
                honoureds(where: { receiver: $account }) {
                    id
                    proposer
                    amount
                }
                }
            `

        const variables = { account: address.toString() }

        const [dataProposals, dataHonoureds] = await Promise.all([
            graphQLClient.request(queryProposals, variables),
            graphQLClient.request(queryHonoureds, variables)
        ])

        // Get the array of proposals and honoured proposals
        const proposals = dataProposals.proposeds
        const honouredProposals = dataHonoureds.honoureds

        // Filter out the proposals that have already been honoured
        // This is not the best method - what happens if a proposer proposes multiple same amount?!
        // TODO: how to set a unique ID in a proposal which an honour tx can reference without
        // adding more gas costs to each call in the contract?
        const filteredProposals = proposals.filter((proposal) => {
            return !honouredProposals.some((honouredProposal) => {
            return (
                honouredProposal.proposer === proposal.proposer &&
                    honouredProposal.amount.toString() === proposal.amount.toString()
            )
            })
        })

        // Set the proposals state to the filtered array of proposals
        setProposals(filteredProposals)
        }

        fetchData()
    }
  }, [address])

  const honourProposal = async (proposer, amount) => {
    openLoading('Please sign this transaction')

    // Call the propose function with the inputted address and amount
    let tx
    try {
      tx = await honour(proposer, amount, chain.id, signer)
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

    // Remove the honoured proposal from the proposals array
    setProposals(proposals.filter(p => p.proposer !== proposer || p.amount !== amount))

    closeLoading()
  }

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
              {ethers.utils.formatUnits(proposal.amount, 18)}
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
                onClick={() => honourProposal(proposal.proposer, proposal.amount)}
              >
                Honour
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Honour
