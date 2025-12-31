// Vercel serverless function to provide Alchemy API key
// This keeps the API key secret on the server side

export default async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Get the API key from environment variable (set in Vercel dashboard)
  const apiKey = process.env.ALCHEMY_API_KEY

  if (!apiKey) {
    // If no API key is set, return null
    return res.status(200).json({ apiKey: null })
  }

  // Return the API key
  return res.status(200).json({
    apiKey: apiKey
  })
}

