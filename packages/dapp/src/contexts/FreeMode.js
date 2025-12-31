import { createContext, useContext, useState } from 'react'

export const FreeModeContext = createContext({
  freeMode: true,
  setFreeMode: () => {}
})

export const useFreeMode = () => {
  return useContext(FreeModeContext)
}

export const FreeModeProvider = ({ children }) => {
  const [freeMode, setFreeMode] = useState(true)

  return (
    <FreeModeContext.Provider value={{ freeMode, setFreeMode }}>
      {children}
    </FreeModeContext.Provider>
  )
}

