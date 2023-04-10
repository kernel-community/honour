import { useContext } from 'react'
import { InspectContext } from '../../contexts/Inspect'

import Modal from '../../layouts/Modal'
import CloseButton from '../common/CloseButton'
import Loading from '../common/Loading'
import Display from './Display'
import Transact from './Transact'

const InspectModal = () => {
  const { state, dispatch } = useContext(InspectContext)
  if (!state.modal) return
  return (
    <Modal bringToFront>
      <div className='p-4 h-min-content max-h-screen w-full md:w-1/2 my-auto rounded-lg shadow-xl bg-white font-volkhorn flex flex-col items-center'>
        <div className='self-end'>
          <CloseButton exec={() => dispatch({ type: 'close' })} />
        </div>
        {state.confirming
          ? (
            <Loading text='Making money weird' />
            )
          : (
            <div className='overflow-y-auto'>
              <Display />
            </div>
            
            )}
        <Transact />
      </div>
    </Modal>
  )
}

export default InspectModal
