import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { createPublicClient, createWalletClient, custom, http, parseUnits, formatUnits, isAddress as viemIsAddress } from 'viem'
import { mainnet, optimism } from 'viem/chains'

const WalletContext = createContext()

export const useWallet = () => {
  const context = useContext(WalletContext)
  if (!context) {
    throw new Error('useWallet must be used within WalletProvider')
  }
  return context
}

export const WalletProvider = ({ children }) => {
  const [account, setAccount] = useState(null)
  const [chainId, setChainId] = useState(null)
  const [isConnected, setIsConnected] = useState(false)
  const [connector, setConnector] = useState(null)

  // Create public clients for each chain
  const publicClients = {
    [mainnet.id]: createPublicClient({
      chain: mainnet,
      transport: http(`https://eth-mainnet.g.alchemy.com/v2/${process.env.REACT_APP_ALCHEMY_API_KEY}`)
    }),
    [optimism.id]: createPublicClient({
      chain: optimism,
      transport: http(`https://opt-mainnet.g.alchemy.com/v2/${process.env.REACT_APP_ALCHEMY_API_KEY}`)
    })
  }

  // Get current chain
  const chain = chainId === mainnet.id ? mainnet : chainId === optimism.id ? optimism : null

  // Get public client for current chain
  const publicClient = chainId ? publicClients[chainId] : null

  // Create wallet client
  const getWalletClient = useCallback(async () => {
    if (!window.ethereum) return null
    return createWalletClient({
      chain: chain || mainnet,
      transport: custom(window.ethereum)
    })
  }, [chain])

  // Connect wallet
  const connect = useCallback(async () => {
    if (!window.ethereum) {
      throw new Error('No wallet found')
    }

    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
      const account = accounts[0]
      const chainId = await window.ethereum.request({ method: 'eth_chainId' })
      
      setAccount(account)
      setChainId(parseInt(chainId, 16))
      setIsConnected(true)
      setConnector('injected')
    } catch (error) {
      throw error
    }
  }, [])

  // Disconnect wallet
  const disconnect = useCallback(() => {
    setAccount(null)
    setChainId(null)
    setIsConnected(false)
    setConnector(null)
  }, [])

  // Switch network
  const switchNetwork = useCallback(async (targetChainId) => {
    if (!window.ethereum) {
      throw new Error('No wallet found')
    }

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${targetChainId.toString(16)}` }]
      })
      setChainId(targetChainId)
    } catch (error) {
      // If chain doesn't exist, add it
      if (error.code === 4902) {
        const chain = targetChainId === optimism.id ? optimism : mainnet
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: `0x${targetChainId.toString(16)}`,
            chainName: chain.name,
            nativeCurrency: chain.nativeCurrency,
            rpcUrls: [chain.rpcUrls.default.http[0]],
            blockExplorerUrls: [chain.blockExplorers?.default?.url]
          }]
        })
        setChainId(targetChainId)
      } else {
        throw error
      }
    }
  }, [])

  // Initialize connection on mount
  useEffect(() => {
    if (window.ethereum) {
      // Check if already connected
      window.ethereum.request({ method: 'eth_accounts' })
        .then(accounts => {
          if (accounts.length > 0) {
            setAccount(accounts[0])
            setIsConnected(true)
            setConnector('injected')
          }
        })

      window.ethereum.request({ method: 'eth_chainId' })
        .then(chainId => {
          setChainId(parseInt(chainId, 16))
        })

      // Listen for account changes
      window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length > 0) {
          setAccount(accounts[0])
          setIsConnected(true)
        } else {
          disconnect()
        }
      })

      // Listen for chain changes
      window.ethereum.on('chainChanged', (chainId) => {
        setChainId(parseInt(chainId, 16))
      })
    }
  }, [disconnect])

  const value = {
    account,
    address: account,
    chainId,
    chain,
    isConnected,
    connector,
    publicClient,
    getWalletClient,
    connect,
    disconnect,
    switchNetwork,
    parseUnits,
    formatUnits,
    isAddress: viemIsAddress
  }

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  )
}

