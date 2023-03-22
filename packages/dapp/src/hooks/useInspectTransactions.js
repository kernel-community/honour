import { useEffect, useState } from 'react'
import { GraphQLClient, gql } from 'graphql-request'
import { graph } from '../utils/constants'

import calculateTrustScore from './calculateTrustScore'

const HONOUR_SUBGRAPH_URL = graph.baseURL
const graphQLClient = new GraphQLClient(HONOUR_SUBGRAPH_URL)

function useInspectTransactions(address, investigator) {
  const [transactions, setTransactions] = useState([])
  const score = calculateTrustScore(transactions, investigator)

  useEffect(() => {
    async function fetchData() {
      const queryProposeds = gql`
        query GetProposals($account: Bytes!) {
          proposeds(where: { receiver: $account }) {
            id
            proposer
            amount
            blockNumber
          }
        }
      `;
      const queryHonoureds = gql`
        query GetHonoureds($account: Bytes!) {
          honoureds(where: { receiver: $account }) {
            id
            proposer
            amount
            blockNumber
          }
        }
      `;
      const queryForgivens = gql`
        query GetForgivens($account: Bytes!) {
          forgivens(where: { forgiven: $account }) {
            id
            forgiver
            amount
            blockNumber
          }
        }
      `;
      const queryAccepteds = gql`
        query getAccepteds($account: Bytes!) {
          accepteds(where: { accepted: $account }) {
            id
            forgiver
            amount
            blockNumber
          }
        }
      `;
      const variables = { account: address.toString() }

      const [dataProposeds, dataHonoureds, dataForgivens, dataAccepteds] = await Promise.all([
        graphQLClient.request(queryProposeds, variables),
        graphQLClient.request(queryHonoureds, variables),
        graphQLClient.request(queryForgivens, variables),
        graphQLClient.request(queryAccepteds, variables).catch(() => ({
          proposeds: [],
          honoureds: [],
          forgivens: [],
          accepteds: [],
        })),
      ])

      // Get the arrays of proposals, honoured proposals, forgivens, and accepteds, using optional chaining
      const proposeds = dataProposeds?.proposeds || []
      const honoureds = dataHonoureds?.honoureds || []
      const forgivens = dataForgivens?.forgivens || []
      const accepteds = dataAccepteds?.accepteds || []

      // Merge all the arrays of transactions into a single array
      const transactions = [        
        ...proposeds.map((proposal) => ({ type: 'Proposed', with: proposal.proposer, amount: proposal.amount, blockNumber: proposal.blockNumber })),        
        ...honoureds.map((honoured) => ({ type: 'Honoured', with: honoured.proposer, amount: honoured.amount, blockNumber: honoured.blockNumber })),        
        ...forgivens.map((forgiven) => ({ type: 'Forgiven', with: forgiven.forgiver, amount: forgiven.amount, blockNumber: forgiven.blockNumber })),        
        ...accepteds.map((accepteds) => ({ type: 'Accepted', with: accepteds.forgiver, amount: accepteds.amount, blockNumber: accepteds.blockNumber })),      
      ];

      // Sort the transactions by blockNumber in descending order
      transactions.sort((a, b) => b.blockNumber - a.blockNumber);

      // Set the transactions state to the sorted array of transactions
      setTransactions(transactions)
    }

    if (address) {
      fetchData()
    }
  }, [address])

  return [transactions, score]
}

export default useInspectTransactions
