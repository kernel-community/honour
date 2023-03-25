import { useEffect, useReducer } from 'react'
import { GraphQLClient, gql } from 'graphql-request'
import { graph } from '../utils/constants'

const HONOUR_SUBGRAPH_URL = graph.baseURL
const graphQLClient = new GraphQLClient(HONOUR_SUBGRAPH_URL)

const initialState = {
  myTransactions: []
}

const reducer = (state, action) => {
  switch (action.type) {
    case 'SET_TRANSACTIONS':
      return {
        ...state,
        myTransactions: action.payload
      }
    default:
      return state
  }
};

const useTransactionsReducer = (address) => {
  const [state, dispatch] = useReducer(reducer, initialState)

  useEffect(() => {
    const fetchTransactions = async () => {
    const queryProposeds = gql`
      query GetProposals($account: Bytes!) {
        proposeds(where: { proposer: $account }) {
          receiver
        }
      }
    `
    const queryHonoureds = gql`
      query GetHonoureds($account: Bytes!) {
        honoureds(where: { receiver: $account }) {
          proposer
        }
      }
    `
    const queryForgivens = gql`
      query GetForgivens($account: Bytes!) {
        forgivens(where: { forgiver: $account }) {
          forgiven
        }
      }
    `
    const queryAccepteds = gql`
      query getAccepteds($account: Bytes!) {
        accepteds(where: { forgiven: $account }) {
          forgiver
        }
      }
    `
    const variables = { account: address.toString() }
    try {
      const [dataProposeds, dataHonoureds, dataForgivens, dataAccepteds] = await Promise.all([
        graphQLClient.request(queryProposeds, variables),
        graphQLClient.request(queryHonoureds, variables),
        graphQLClient.request(queryForgivens, variables),
        graphQLClient.request(queryAccepteds, variables).catch(() => ({
          proposeds: [],
          honoureds: [],
          forgivens: [],
          accepteds: []
        }))
      ])
      // Get the arrays of proposals, honoured proposals, forgivens, and accepteds, using optional chaining
      const proposeds = dataProposeds?.proposeds || []
      const honoureds = dataHonoureds?.honoureds || []
      const forgivens = dataForgivens?.forgivens || []
      const accepteds = dataAccepteds?.accepteds || []
      
      // Merge all the arrays of transactions into a single array
      const myTransactions = [
        ...proposeds.map((proposal) => ({
          type: 'Proposed',
          with: proposal.receiver
        })),
        ...honoureds.map((honoured) => ({
          type: 'Honoured',
          with: honoured.proposer
        })),
        ...forgivens.map((forgiven) => ({
          type: 'Forgiven',
          with: forgiven.forgiven
        })),
        ...accepteds.map((accepted) => ({
          type: 'Accepted',
          with: accepted.forgiver
        }))
      ]
      dispatch({ type: 'SET_TRANSACTIONS', payload: myTransactions })
    } catch (error) {
      console.log(error)
    }
  }
  fetchTransactions()
  }, [address] )
  
  return state
}

export default useTransactionsReducer;