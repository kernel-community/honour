import { SwitchNetworkContext } from '../contexts/SwitchNetwork'
import { useContext, useState } from 'react'
import { useWallet } from '../contexts/Wallet'
import Spinner from './common/Spinner'
import Modal from '../layouts/Modal'

const SwitchNetworkModal = () => {
  const { state } = useContext(SwitchNetworkContext)
  const { switchNetwork } = useWallet()
  const [isLoading, setIsLoading] = useState(false)
  
  if (!state.modal) return
  
  const handleSwitchNetwork = async () => {
    setIsLoading(true)
    try {
      await switchNetwork(10)
    } catch (error) {
      console.error('Failed to switch network:', error)
    } finally {
      setIsLoading(false)
    }
  }
  
  return (
    <Modal bringToFront>
      <div className='p-12 md:w-80 w-full h-min-content my-auto rounded-lg shadow-xl bg-white font-volkhorn text-lg backdrop-blur-lg text-center'>
        <div className='my-2'>
          Please switch to&nbsp;
        </div>
        <div className='flex flex-col gap-2'>
          <button
            onClick={handleSwitchNetwork}
            className={`
                py-2 px-6 my-4 bg-slate-200 rounded-lg hover:bg-slate-300 flex flex-row items-center gap-2
              `}
          >
            <div className='grow'>
              {'Optimism'}
            </div>
            {
                isLoading && (
                  <Spinner />
                )
              }
          </button>
          <div>
            If the button doesn't work, try switching the provider manually in your wallet.
          </div>
        </div>
      </div>
    </Modal>
  )
}

export default SwitchNetworkModal
