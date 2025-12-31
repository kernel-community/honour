import Modal from '../../layouts/Modal'
import DismissButton from './DismissButton'

const SuccessModal = ({ text, hash, onClose }) => {
  return (
    <Modal bringToFront>
      <div className='p-8 w-full h-min-content sm:w-80 my-auto rounded-lg shadow-xl bg-white font-garamond text-lg backdrop-blur-lg text-center'>
        <div className='flex flex-col items-center gap-8'>
          <div className='text-green-600'>
            {text || 'Transaction successful!'}
          </div>
          {hash && (
            <div className='text-sm'>
              <a
                href={`https://optimistic.etherscan.io/tx/${hash}`}
                target='_blank'
                rel='noopener noreferrer'
                className='text-blue-600 hover:text-blue-800 underline'
              >
                View on Optimistic Etherscan
              </a>
            </div>
          )}
          <DismissButton
            selectStyle='basic'
            exec={onClose}
            text='Dismiss'
          />
        </div>
      </div>
    </Modal>
  )
}

export default SuccessModal

