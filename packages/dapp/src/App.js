import { HashRouter } from "react-router-dom";
import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Learn from './pages/Learn'
import TrustScore from './pages/TrustScore'
import SwitchNetworkModal from './components/SwitchNetwork'
import { SwitchNetworkProvider } from './contexts/SwitchNetwork'
import { BalanceProvider } from './contexts/Balance'
import { QRReadProvider } from './contexts/QRRead'
import { InspectProvider } from './contexts/Inspect'
import { LoadingProvider } from './hooks/useLoading'
import { ErrorProvider } from './hooks/useError'

const App = () => {
  return (
    <SwitchNetworkProvider>
      <BalanceProvider>
        <QRReadProvider>
          <InspectProvider>
            <LoadingProvider>
              <ErrorProvider>
                <div>
                  <SwitchNetworkModal />
                  <HashRouter>
                    <Routes>
                      <Route path={'/'} element={<Home />} />
                      <Route path={'/learn'} element={<Learn />} />
                      <Route path={'/trust'} element={<TrustScore />} />
                    </Routes>
                  </HashRouter>
                </div>
              </ErrorProvider>
            </LoadingProvider>
          </InspectProvider>
        </QRReadProvider>
      </BalanceProvider>
    </SwitchNetworkProvider>
  )
}

export default App
