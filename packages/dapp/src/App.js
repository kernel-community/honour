import { Routes, HashRouter, Route } from 'react-router-dom'
import Home from './pages/Home'
import Learn from './pages/Learn'
import TrustScore from './pages/TrustScore'
import { BalanceProvider } from './contexts/Balance'
import { QRReadProvider } from './contexts/QRRead'
import { InspectProvider } from './contexts/Inspect'
import { FreeModeProvider } from './contexts/FreeMode'
import { LoadingProvider } from './hooks/useLoading'
import { ErrorProvider } from './hooks/useError'
import { SuccessProvider } from './hooks/useSuccess'

const App = () => {
  return (
    <HashRouter>
      <FreeModeProvider>
        <BalanceProvider>
          <QRReadProvider>
            <InspectProvider>
              <LoadingProvider>
                <ErrorProvider>
                  <SuccessProvider>
                    <div>
                      <Routes>
                        <Route path={'/'} element={<Home />} />
                        <Route path={'/learn'} element={<Learn />} />
                        <Route path={'/trust'} element={<TrustScore />} />
                      </Routes>
                    </div>
                  </SuccessProvider>
                </ErrorProvider>
              </LoadingProvider>
            </InspectProvider>
          </QRReadProvider>
        </BalanceProvider>
      </FreeModeProvider>
    </HashRouter>
  )
}

export default App
