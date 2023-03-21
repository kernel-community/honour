import Footer from '../components/Footer'
import Header from '../components/Header'

const Main = ({ children }) => {
  return (
    <div className='min-h-screen flex flex-col items-center justify-center'>
      <Header />
      <div className='flex-1 w-full mb-36'>
        {children}
      </div>
      <Footer />
    </div>
  )
}

export default Main
