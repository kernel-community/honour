import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { createPublicClient, createWalletClient, custom, http } from 'viem'
import { optimism, mainnet } from 'viem/chains'
import { getAlchemyApiKey } from '../utils/alchemyConfig'

const WalletContext = createContext()

export const useWallet = () => {
  const context = useContext(WalletContext)
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider')
  }
  return context
}

export const WalletProvider = ({ children }) => {
  const [address, setAddress] = useState(null)
  const [userChain, setUserChain] = useState(null) // User's actual wallet chain (for display only)
  const [userChainId, setUserChainId] = useState(null) // User's actual wallet chainId (for display only)
  const [isConnected, setIsConnected] = useState(false)
  const [publicClient, setPublicClient] = useState(null)
  const [walletClient, setWalletClient] = useState(null)

  // Always use Optimism for the app - initialize clients for Optimism
  useEffect(() => {
    if (!window.ethereum) {
      setPublicClient(null)
      setWalletClient(null)
      return
    }

    const initializeClients = async () => {
      try {
        // Get API key from API route (keeps it secret)
        const alchemyApiKey = await getAlchemyApiKey()
        
        // Use Alchemy RPC endpoint if available, otherwise fall back to public RPC
        const rpcUrl = alchemyApiKey
          ? `https://opt-mainnet.g.alchemy.com/v2/${alchemyApiKey}`
          : undefined

        // Always create public client for Optimism
        const publicClientInstance = createPublicClient({
          chain: optimism,
          transport: http(rpcUrl)
        })

        // Create wallet client - will use user's wallet for signing but transactions go to Optimism
        const walletClientInstance = createWalletClient({
          chain: optimism,
          transport: custom(window.ethereum)
        })

        setPublicClient(publicClientInstance)
        setWalletClient(walletClientInstance)
      } catch (error) {
        console.error('Error creating clients:', error)
        setPublicClient(null)
        setWalletClient(null)
      }
    }

    initializeClients()
  }, []) // Only run once on mount

  // Check if wallet is already connected
  useEffect(() => {
    const checkConnection = async () => {
      if (!window.ethereum) {
        // Explicitly set to disconnected state if no provider
        setIsConnected(false)
        setAddress(null)
        setUserChain(null)
        setUserChainId(null)
        return
      }

      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' })
        if (accounts && accounts.length > 0) {
          const account = accounts[0]
          setAddress(account)
          setIsConnected(true)

          // Get current chain (for display purposes only - we always use Optimism for transactions)
          const chainIdHex = await window.ethereum.request({ method: 'eth_chainId' })
          const chainIdNum = parseInt(chainIdHex, 16)
          setUserChainId(chainIdNum)

          // Map chainId to chain object (for display only)
          const currentChain = chainIdNum === optimism.id ? optimism : chainIdNum === mainnet.id ? mainnet : null
          setUserChain(currentChain)
        } else {
          // No accounts connected - explicitly set disconnected state
          setIsConnected(false)
          setAddress(null)
          setUserChain(null)
          setUserChainId(null)
        }
      } catch (error) {
        console.error('Error checking connection:', error)
        // On error, set to disconnected state
        setIsConnected(false)
        setAddress(null)
        setUserChain(null)
        setUserChainId(null)
      }
    }

    checkConnection()

    // Listen for account changes
    const handleAccountsChanged = (accounts) => {
      if (accounts && accounts.length > 0) {
        const account = accounts[0]
        setAddress(account)
        setIsConnected(true)
        // Re-fetch chain info when account changes (for display only)
        window.ethereum.request({ method: 'eth_chainId' })
          .then(chainIdHex => {
            const chainIdNum = parseInt(chainIdHex, 16)
            setUserChainId(chainIdNum)
            const currentChain = chainIdNum === optimism.id ? optimism : chainIdNum === mainnet.id ? mainnet : null
            setUserChain(currentChain)
          })
          .catch(err => console.error('Error fetching chain after account change:', err))
      } else {
        setAddress(null)
        setIsConnected(false)
        setUserChain(null)
        setUserChainId(null)
      }
    }

    // Listen for chain changes (for display only - we always use Optimism for transactions)
    const handleChainChanged = (chainIdHex) => {
      const chainIdNum = parseInt(chainIdHex, 16)
      setUserChainId(chainIdNum)
      const currentChain = chainIdNum === optimism.id ? optimism : chainIdNum === mainnet.id ? mainnet : null
      setUserChain(currentChain)
    }

    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged)
      window.ethereum.on('chainChanged', handleChainChanged)
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged)
        window.ethereum.removeListener('chainChanged', handleChainChanged)
      }
    }
  }, [])

  // Connect wallet function
  const connect = useCallback(async () => {
    if (!window.ethereum) {
      throw new Error('No ethereum provider found. Please install MetaMask or another Web3 wallet.')
    }

    try {
      // Request account access
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
      
      if (accounts && accounts.length > 0) {
        const account = accounts[0]
        setAddress(account)
        setIsConnected(true)

        // Get current chain (for display purposes only - we always use Optimism for transactions)
        const chainIdHex = await window.ethereum.request({ method: 'eth_chainId' })
        const chainIdNum = parseInt(chainIdHex, 16)
        setUserChainId(chainIdNum)

        // Map chainId to chain object (for display only)
        const currentChain = chainIdNum === optimism.id ? optimism : chainIdNum === mainnet.id ? mainnet : null
        setUserChain(currentChain)
      }
    } catch (error) {
      console.error('Error connecting wallet:', error)
      throw error
    }
  }, [])

  // Switch network function
  const switchNetwork = useCallback(async (targetChainId) => {
    if (!window.ethereum) {
      throw new Error('No ethereum provider found')
    }

    try {
      // Try to switch to the chain
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${targetChainId.toString(16)}` }]
      })
    } catch (switchError) {
      // This error code indicates that the chain has not been added to MetaMask
      if (switchError.code === 4902) {
        // Try to add the chain
        const targetChain = targetChainId === optimism.id ? optimism : targetChainId === mainnet.id ? mainnet : null
        
        if (!targetChain) {
          throw new Error(`Unsupported chain ID: ${targetChainId}`)
        }

        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: `0x${targetChainId.toString(16)}`,
            chainName: targetChain.name,
            nativeCurrency: {
              name: targetChain.nativeCurrency.name,
              symbol: targetChain.nativeCurrency.symbol,
              decimals: targetChain.nativeCurrency.decimals
            },
            rpcUrls: [targetChain.rpcUrls.default.http[0]],
            blockExplorerUrls: targetChain.blockExplorers ? [targetChain.blockExplorers.default.url] : []
          }]
        })
      } else {
        throw switchError
      }
    }
  }, [])

  // Get wallet client function - always returns Optimism client
  const getWalletClient = useCallback(async () => {
    if (!walletClient) {
      if (!window.ethereum) {
        throw new Error('No ethereum provider found')
      }
      // Always return Optimism client
      return createWalletClient({
        chain: optimism,
        transport: custom(window.ethereum)
      })
    }
    return walletClient
  }, [walletClient])

  const value = {
    address,
    chain: userChain, // User's actual chain (for display only)
    chainId: optimism.id, // Always return Optimism chainId for app operations
    userChainId, // User's actual chainId (for display/info purposes)
    isConnected,
    publicClient, // Always Optimism
    getWalletClient, // Always returns Optimism client
    connect,
    switchNetwork
  }

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  )
}

