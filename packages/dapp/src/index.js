import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import App from './App'
import { createClient, configureChains, WagmiConfig } from 'wagmi'
import { mainnet, goerli } from 'wagmi/chains'
import { alchemyProvider } from 'wagmi/providers/alchemy'
import { BrowserRouter } from 'react-router-dom'

const root = ReactDOM.createRoot(document.getElementById('root'))
const { provider, webSocketProvider } = configureChains(
  [mainnet, goerli],
  [alchemyProvider({ apiKey: process.env.REACT_APP_ALCHEMY_API_KEY })]
)
console.log("ALCHEMY_API_KEY:", process.env.REACT_APP_ALCHEMY_API_KEY)
const client = createClient({
  provider,
  webSocketProvider,
  autoConnect: true
})
root.render(
  <WagmiConfig client={client}>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </WagmiConfig>
)
