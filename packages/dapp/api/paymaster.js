// Vercel serverless function to provide paymaster configuration
// This keeps the policy ID secret on the server side

export default async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Get the policy ID from environment variable (set in Vercel dashboard)
  const policyId = process.env.ALCHEMY_PAYMASTER_POLICY_ID

  if (!policyId) {
    // If no policy ID is set, return empty capabilities (no paymaster)
    return res.status(200).json({ capabilities: {} })
  }

  // Return the paymaster configuration
  return res.status(200).json({
    capabilities: {
      paymasterService: {
        policyId: policyId
      }
    }
  })
}

