// Helper to get Alchemy API key from API route
// In production (Vercel), uses API route to keep API key secret
// In development, falls back to environment variable if API route unavailable

export const getAlchemyApiKey = async () => {
  // In development, try API route first, but fall back to env var
  const isDevelopment = process.env.NODE_ENV === 'development'
  
  try {
    // Use relative path for API route (Vercel will handle the routing)
    const response = await fetch('/api/alchemy-key')
    if (!response.ok) {
      throw new Error('API route not available')
    }
    const data = await response.json()
    return data.apiKey || null
  } catch (error) {
    // In development, fall back to environment variable if API route fails
    if (isDevelopment && process.env.REACT_APP_ALCHEMY_API_KEY) {
      return process.env.REACT_APP_ALCHEMY_API_KEY
    }
    // In production, if API route fails, return null (will use public RPC)
    return null
  }
}

