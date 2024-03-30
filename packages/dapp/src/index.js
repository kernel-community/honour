import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import App from './App'
import { createClient, configureChains, WagmiConfig } from 'wagmi'
import { mainnet, optimism } from 'wagmi/chains'
import { alchemyProvider } from 'wagmi/providers/alchemy'

const root = ReactDOM.createRoot(document.getElementById('root'))
const { provider, webSocketProvider } = configureChains(
  [mainnet, optimism],
  [alchemyProvider({ apiKey: process.env.REACT_APP_ALCHEMY_API_KEY })]
)
const client = createClient({
  provider,
  webSocketProvider,
  autoConnect: true
})
root.render(
  <WagmiConfig client={client}>
      <App />
  </WagmiConfig>
)
