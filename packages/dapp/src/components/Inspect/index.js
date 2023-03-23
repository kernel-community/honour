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
      <div className='md:p-8 w-full h-min-content md:w-3/4 my-auto rounded-lg shadow-xl bg-white font-volkhorn flex flex-col items-center py-6 sm:py-0'>
        <div className='self-end'>
          <CloseButton exec={() => dispatch({ type: 'close' })} />
        </div>
        {state.confirming
          ? (
            <Loading text='Making money weird' />
            )
          : (
            <Display />
            )}
        <Transact />
      </div>
    </Modal>
  )
}

export default InspectModal
