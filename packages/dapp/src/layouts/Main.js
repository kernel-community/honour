import Footer from '../components/Footer'
import Header from '../components/Header'
import Tooltip from '../components/common/ToolTip'
import { useFreeMode } from '../contexts/FreeMode'

const Main = ({ children }) => {
  const { freeMode, setFreeMode } = useFreeMode()

  return (
    <div className='min-h-screen flex flex-col items-center justify-center'>
      <Header />
      <div className='w-full flex justify-center py-4'>
        <Tooltip
          text={
            <div className='flex flex-col items-center gap-2'>
              <button
                type='button'
                onClick={() => setFreeMode(!freeMode)}
                className={`
                  relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent
                  transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2
                  ${freeMode ? 'bg-indigo-600' : 'bg-gray-200'}
                `}
                role='switch'
                aria-checked={freeMode}
              >
                <span
                  className={`
                    pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0
                    transition duration-200 ease-in-out
                    ${freeMode ? 'translate-x-5' : 'translate-x-0'}
                  `}
                />
              </button>
              <span className='text-sm text-gray-600 font-volkhorn'>Free Mode</span>
            </div>
          }
          tooltip='Free mode means no fees, so you can be as weird as you like. Toggle this off if you want to interact with a specific address, rather than the smart account generated to pay its fees.'
          position='bottom'
        />
      </div>
      <div className='flex-1 w-full mb-36'>
        {children}
      </div>
      <Footer />
    </div>
  )
}

export default Main
