import React, { createContext, useReducer, useMemo } from 'react'
import InspectModal from '../components/Inspect'

export const InspectContext = createContext()

const initial = {
  modal: false,
  confirming: false,
  button: null,
  address: null,
  amount: null,
  id: null,
  acceptedId: null,
  honouredId: null
}

const reducer = (state = initial, action) => {
  switch (action.type) {
    case 'close': {
      return {
        ...state,
        modal: false
      }
    }
    case 'confirming': {
      return {
        ...state,
        confirming: true
      }
    }
    case 'confirmed': {
      return {
        ...state,
        confirming: false
      }
    }
    case 'accept': {
      return {
        ...state,
        modal: action.payload.showModal,
        button: 'accept',
        id: action.payload.id,
        address: action.payload.address,
        amount: action.payload.amount
      }
    }
    case 'acceptEvent': {
      return {
        ...state,
        acceptedId: action.payload.id
      }
    }
    case 'honour': {
      return {
        ...state,
        modal: action.payload.showModal,
        button: 'honour',
        id: action.payload.id,
        address: action.payload.address,
        amount: action.payload.amount
      }
    }
    case 'honourEvent': {
      return {
        ...state,
        honouredId: action.payload.id
      }
    }
    case 'hideModal': {
      return {
        ...state,
        modal: false
      }
    }
    default: return state
  }
}

export const InspectProvider = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initial)
  const value = useMemo(() => {
    return {
      state,
      dispatch
    }
  }, [state, dispatch])
  return (
    <InspectContext.Provider value={value}>
      {state.modal && <InspectModal />}
      {children}
    </InspectContext.Provider>
  )
}
