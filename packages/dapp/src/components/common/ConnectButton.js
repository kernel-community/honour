import { useState } from 'react'
import { useWallet } from '../../contexts/Wallet'

const base = `
  text-center
  text-gray-500
  border-2
  border-gray-500
  rounded-md
  py-1
  px-4

  sm:px-4 sm:py-2
  sm:shadow sm:shadow-gray-300
  sm:transition-all
  font-redaction

  hover:shadow-md
  hover:shadow-gray-500
  hover:text-gray-800
  hover:bg-gray-100
`

const greenButtonStyle = `
  ${base} bg-transparent cursor-pointer
`
const greenButtonDisabledStyle = `
  ${base} bg-transparent  cursor-wait
`

const ConnectButton = ({ disabled = false }) => {
  const { connect, isConnected } = useWallet()
  const [error, setError] = useState(null)

  const handleConnect = async () => {
    try {
      setError(null)
      await connect()
    } catch (err) {
      setError(err.message || 'Failed to connect')
    }
  }

  if (isConnected) return null

  return (
    <div className='flex flex-col gap-1'>
      <div
        className={disabled ? greenButtonDisabledStyle : greenButtonStyle}
        onClick={handleConnect}
      >
        Connect
      </div>
      {
        error &&
        <div className='text-red-400 text-sm sm:text-base'>Failed to connect</div>
      }
    </div>
  )
}
export default ConnectButton
