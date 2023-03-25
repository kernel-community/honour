import React, { createContext, useReducer, useMemo } from 'react'

export const QRReadContext = createContext()

const initial = {
  recipient: '',
  forgiven: '',
  showPropScanner: false,
  showForScanner: false
}

const reducer = (state = initial, action) => {
  switch (action.type) {
    case 'recipient':
      return {
        ...state,
        recipient: action.payload,
        showPropScanner: false
      }
    case 'forgiven':
      return {
        ...state,
        forgiven: action.payload,
        showForScanner: false
      }
    case 'showPropScanner':
      return {
        ...state,
        showPropScanner: !state.showPropScanner
      }
    case 'showForScanner':
      return {
        ...state,
        showForScanner: !state.showForScanner
      }
    default:
      return state
  }
}

export const QRReadProvider = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initial)
  const value = useMemo(() => {
    return {
      state,
      dispatch
    }
  }, [state, dispatch])
  return (
    <QRReadContext.Provider value={value}>
      {children}
    </QRReadContext.Provider>
  )
}
