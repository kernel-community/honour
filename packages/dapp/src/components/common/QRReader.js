import { useState, useContext } from 'react'
import { QRReadContext } from '../../contexts/QRRead'
import QrReader from 'react-qr-reader'

const QRReader = ({ type }) => {
  const [facingMode, setFacingMode] = useState('environment')
  const { dispatch } = useContext(QRReadContext)
  const handleScan = async (scanData) => {
    if (scanData && scanData !== '') {
      dispatch({ type, payload: scanData })
    }
  }
  const handleError = (err) => {
    console.error(err)
  }
  const handleCameraSwitch = () => {
    setFacingMode((prevState) =>
      prevState === 'user' ? 'environment' : 'user'
    )
  }
  return (
    <div className='mx-auto mb-4 text-center'>
      <QrReader
        onScan={handleScan}
        onError={handleError}
        style={{ width: '300px' }}
        facingMode={window.innerWidth >= 768 ? 'user' : facingMode}
      />
      <button
        className='w-1/2 px-4 py-2 mt-4 mx-auto text-white rounded-md focus:outline-none focus:ring bg-[#233447] hover:bg-indigo-700 focus:ring-indigo-500'
        onClick={handleCameraSwitch}
      >
        Change Camera
      </button>
    </div>
  )
}

export default QRReader
