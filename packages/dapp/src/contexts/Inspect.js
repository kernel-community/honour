import React, { createContext, useReducer, useMemo } from 'react'
import InspectModal from '../components/Inspect'

export const InspectContext = createContext()

const initial = { 
    modal: false,
    button: null,
    address: null, 
    amount: null
}

const reducer = (state = initial, action) => {
    switch (action.type) {
        case 'accept': {
            return { 
                ...state, 
                modal: action.payload.showModal,
                button: 'accept', 
                address: action.payload.address 
            }
        }
        case 'honour': {
            return { 
                ...state, 
                modal: action.payload.showModal,
                button: 'honour', 
                address: action.payload.address,
                amount: action.payload.amount 
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