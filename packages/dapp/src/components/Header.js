import { useLocation, Link } from 'react-router-dom'
import { useNetwork } from 'wagmi'
import { useDisplayableAddress } from '../hooks/useDisplayableAddress'
import ConnectButton from './common/ConnectButton'

const Header = () => {
  const toDisplay = useDisplayableAddress()
  const { chain } = useNetwork()

  return (
    <>
      {/* DESKTOP NAVBAR */}
      <div className='
        sm:flex flex-row text-gray-800 w-full pt-6 text-lg font-redaction justify-between
        pl-6 gap-2 mx-auto
        hidden
      '
      >
        <Items />
        <div className='
        text-gray-400
        pr-6 flex flex-row gap-1 items-center
      '
        >
          {
          (toDisplay && chain) &&
            (
              <>
                <span>signing as</span>
                <span className='hover:text-black'>{toDisplay}</span>
                <span>on</span>
                {chain && <span className='hover:text-black'>{chain.name}</span>}
              </>
            )
        }
          {
          !chain &&
          (
            <ConnectButton />
          )
        }
        </div>
      </div>

      {/* MOBILE NAVBAR */}
      <div className='sm:hidden flex flex-col font-redaction text-xs w-full'>
        <div className='
      flex flex-row justify-between font-redaction pt-6 w-full px-4
    '
        >
          <div className='flex flex-col'>
            <div>Honour</div>
          </div>
          <div>
            <Items />
          </div>
          {
          toDisplay &&
            (
              <div className='flex flex-col'>
                <span className='hover:text-black'>{toDisplay}</span>
                {chain && <span className='hover:text-black'>{chain.name}</span>}
              </div>
            )
      }
          {
          !chain &&
          (
            <ConnectButton />
          )
      }
        </div>
      </div>
    </>
  )
}

const Items = () => {
  const { pathname } = useLocation()

  return (
    <div className='flex flex-row gap-2'>
      <Link
        to='/'
        className={`cursor-pointer hover:text-black no-underline ${pathname === '/' ? 'text-black' : 'text-gray-400'}`}
      >
        <div>
          transact
        </div>
      </Link>
      <div>
        |
      </div>
      <Link
        to='/learn'
        className={`cursor-pointer hover:text-black no-underline ${pathname === '/learn' ? 'text-black' : 'text-gray-400'}`}
      >
        <div>
          learn
        </div>
      </Link>
    </div>
  )
}

export default Header
