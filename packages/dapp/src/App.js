import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Learn from './pages/Learn'
import SwitchNetworkModal from './components/SwitchNetwork'
import { SwitchNetworkProvider } from './contexts/SwitchNetwork'
import { BalanceProvider } from './contexts/Balance'
import { LoadingProvider } from './hooks/useLoading'
import { ErrorProvider } from './hooks/useError'

const App = () => {
  return (
    <SwitchNetworkProvider>
      <BalanceProvider>
        <LoadingProvider>
          <ErrorProvider>
            <div>
              <SwitchNetworkModal />
              <Routes>
                <Route path='/' element={<Home />} />
                <Route path='/learn' element={<Learn />} />
              </Routes>
            </div>
          </ErrorProvider>
        </LoadingProvider>
      </BalanceProvider>
    </SwitchNetworkProvider>
  )
}

export default App
