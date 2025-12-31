import { useState, createContext, useMemo, useContext } from 'react'
import SuccessModal from '../components/common/SuccessModal'

export const SuccessContext = createContext({
  text: '',
  hash: '',
  isOpen: false,
  set: () => {},
  open: () => {},
  close: () => {},
  setIsOpen: () => {},
  setText: () => {},
  setHash: () => {}
})

export default function useSuccess () {
  return useContext(SuccessContext)
}

export const SuccessProvider = ({ children }) => {
  const [text, setText] = useState('')
  const [hash, setHash] = useState('')
  const [isOpen, setIsOpen] = useState(false)

  const close = () => {
    setIsOpen(false)
    setHash('')
  }

  const value = useMemo(() => {
    return {
      isOpen,
      open: (text, hash = '') => {
        setText(text)
        setHash(hash)
        setIsOpen(true)
      },
      close,
      setIsOpen,
      setText,
      setHash
    }
  }, [setText, setHash, setIsOpen, isOpen])

  return (
    <SuccessContext.Provider value={value}>
      <>
        {isOpen &&
          <SuccessModal
            text={text}
            hash={hash}
            onClose={close}
          />}
        {children}
      </>
    </SuccessContext.Provider>
  )
}

