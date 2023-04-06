import { SwitchNetworkContext } from '../contexts/SwitchNetwork'
import { useContext } from 'react'
import { useSwitchNetwork } from 'wagmi'
import Spinner from './common/Spinner'
import Modal from '../layouts/Modal'

export const isDev = true

const SwitchNetworkModal = () => {
  const { state } = useContext(SwitchNetworkContext)
  const { isLoading, pendingChainId, switchNetwork } = useSwitchNetwork()
  if (!state.modal) return
  return (
    <Modal bringToFront>
      <div className='p-12 md:w-80 w-full h-min-content my-auto rounded-lg shadow-xl bg-white font-volkhorn text-lg backdrop-blur-lg text-center'>
        <div className='my-2'>
          Please switch to&nbsp;
        </div>
        <div className='flex flex-col gap-2'>
          <button
            onClick={() => switchNetwork(isDev ? 5 : 1)}
            className={`
                py-2 px-6 my-4 bg-slate-200 rounded-lg hover:bg-slate-300 flex flex-row items-center gap-2
              `}
          >
            <div className='grow'>
              {isDev ? 'Goerli' : 'Ethereum'}
            </div>
            {
                isLoading && pendingChainId === 5 && (
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
