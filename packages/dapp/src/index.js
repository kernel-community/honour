import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import App from './App'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WalletProvider, useWallet } from './contexts/Wallet'
import { SmartAccountProvider } from './contexts/SmartAccount'

const queryClient = new QueryClient()

// Wrapper component to provide SmartAccount with wallet data
const AppWithSmartAccount = () => {
  const { address } = useWallet()
  
  return (
    <SmartAccountProvider eoaAddress={address}>
      <App />
    </SmartAccountProvider>
  )
}

const root = ReactDOM.createRoot(document.getElementById('root'))
root.render(
  <QueryClientProvider client={queryClient}>
    <WalletProvider>
      <AppWithSmartAccount />
    </WalletProvider>
  </QueryClientProvider>
)
