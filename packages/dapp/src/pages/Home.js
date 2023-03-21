import Balance from '../components/Balance'
import Propose from '../components/Propose'
import Honour from '../components/Honour'
import Forgive from '../components/Forgive'
import Accept from '../components/Accept'
import Main from '../layouts/Main'

const Home = () => {
  return (
    <Main>
      <Balance />
      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        <div className='bg-white rounded-md p-2 md:p-20'>
          <Propose />
          <Honour />
        </div>
        <div className='bg-white rounded-md p-2 md:p-20'>
          <Forgive />
          <Accept />
        </div>
      </div>
    </Main>
  )
}

export default Home
