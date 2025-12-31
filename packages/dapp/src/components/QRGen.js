import { useState, useEffect } from 'react'
import { useWallet } from '../contexts/Wallet'
import QRCode from 'qrcode.react'
import Modal from '../layouts/Modal'

const QRGen = () => {
  const { address } = useWallet()
  const [modal, showModal] = useState(false)
  const [qrSize, setQrSize] = useState(250)

  useEffect(() => {
    const calculateSize = () => {
      // Calculate size based on viewport width, leaving room for padding
      const maxSize = Math.min(250, window.innerWidth - 128) // 128px for padding and margins
      setQrSize(Math.max(200, maxSize)) // Minimum 200px
    }
    
    calculateSize()
    window.addEventListener('resize', calculateSize)
    return () => window.removeEventListener('resize', calculateSize)
  }, [])

  return (
    <div>
      {!modal
        ? (
          <div className='mx-auto w-80 my-4'>
            <button
              className='w-full lg:px-4 py-2 text-white bg-[#233447] rounded-md hover:bg-indigo-700 focus:outline-none focus:ring focus:ring-indigo-500'
              onClick={() => showModal(true)}
            >
              <span>Show my address QR</span>
            </button>
          </div>
          )
        : (
          <Modal bringToFront>
            <div className='p-4 sm:p-8 w-full max-w-sm my-auto rounded-lg shadow-xl bg-white font-volkhorn text-lg text-center flex flex-col items-center overflow-hidden'>
              <div className='my-6 sm:my-10 w-full flex justify-center'>
                <QRCode 
                  size={qrSize}
                  value={address}
                  renderAs='svg'
                />
              </div>
              <button
                className='w-32 px-4 py-2 border-2 border-gray-200 rounded-md hover:border-gray-400 transition-all cursor-pointer flex justify-center z-[50] mb-2'
                onClick={() => showModal(false)}
              >
                Dismiss
              </button>
            </div>
          </Modal>
          )}
    </div>
  )
}

export default QRGen
