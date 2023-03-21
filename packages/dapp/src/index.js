import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import App from './App'
import { createClient, configureChains, WagmiConfig } from 'wagmi'
import { mainnet, goerli, localhost } from 'wagmi/chains'
import { publicProvider } from 'wagmi/providers/public'
import { BrowserRouter } from 'react-router-dom'

const root = ReactDOM.createRoot(document.getElementById('root'))
const { provider, webSocketProvider } = configureChains(
  [mainnet, goerli, localhost],
  [publicProvider()]
)
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
