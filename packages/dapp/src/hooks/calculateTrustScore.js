const calculateTrustScore = (theirTransactions, myTransactions, myAddress) => {
  let score = 0
  const txCount = theirTransactions.length
  let totalAmount = 0
  let maxAmount = 0

  // check if any addresses I have interacted with match any address they have interacted with
  for (let i = 0; i < theirTransactions.length; i++) {
    const theirTransaction = theirTransactions[i]
    for (let j = 0; j < myTransactions.length; j++) {
      const myTransaction = myTransactions[j]
      if (theirTransaction.with === myTransaction.with) {
        score++
      }
    }
  }

  theirTransactions.forEach((tx) => {
    const txWith = tx.with.toLowerCase()
    const txValue = parseInt(tx.amount)

    // Check if the inspected account (which is associated with the transactions being passed in)
    // has "honoured" a proposal from myAddress
    if (txWith === myAddress.toLowerCase() && tx.type === 'Honoured') {
      score += 2
    }

    // Check if the inspected account has "forgiven" myAddress
    if (txWith === myAddress.toLowerCase() && tx.type === 'Forgiven') {
      score += 2
    }

    // Check if the inspected account has "accepted" a forgiven transaction from myAddress
    if (txWith === myAddress.toLowerCase() && tx.type === 'Accepted') {
      score += 2
    }

    // Calculate total amount, and max amount
    totalAmount += txValue
    if (txValue > maxAmount) {
      maxAmount = txValue
    }
  })

  // Calculate the average transaction amount
  const avgAmount = totalAmount / txCount

  // Check if the account has proposed an amount more than 2 magnitudes of order larger than its average
  // It would be best to improve this in line with Ostrom's principles for the commons, esp graduating sanctions.
  if (maxAmount > 100 * avgAmount) {
    score -= 1
  }

  // Check if the account has accepted a transaction that is 2 magnitudes of order larger than its average
  theirTransactions.forEach((tx) => {
    const txValue = parseInt(tx.value)
    if (tx.type === 'Accepted' && txValue > 100 * avgAmount) {
      score -= 1
    }
  })

  return score
}

export default calculateTrustScore
