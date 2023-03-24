import { useState } from 'react'
import { useAccount } from 'wagmi'
import QRCode from 'qrcode.react'
import Modal from '../layouts/Modal'

const QRGen = () => {
  const { address } = useAccount()
  const [modal, showModal] = useState(false)

  return (
    <div>
      {!modal ? (
        <div className='mx-auto w-80 my-4'>
            <button
                className='w-full lg:px-4 py-2 text-white bg-[#233447] rounded-md hover:bg-indigo-700 focus:outline-none focus:ring focus:ring-indigo-500'
                onClick={() => showModal(true)}
            >
                <span>Show my address QR</span>
            </button>
        </div>
      ) : (
        <Modal bringToFront>
          <div className='md:p-8 w-full h-min-content md:w-80 my-auto rounded-lg shadow-xl bg-white font-volkhorn text-lg text-center flex flex-col items-center py-6 sm:py-0'>
            <div className='my-10 px-8 text-xl'>
              <QRCode size='250' value={address} />
            </div>
            <button
                className='sm:w-32 sm:px-4 sm:py-2 w-24 px-2 py-1 border-2 border-gray-200 rounded-md hover:border-gray-400 transition-all cursor-pointer flex justify-center z-[50]'
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
