import React, { createContext, useContext, useReducer } from 'react'

// Define the initial state of the balance
const initialState = {
  value: 0
}

// Create the balance context
const BalanceContext = createContext(initialState)

// Define the balance reducer function
const balanceReducer = (state, action) => {
  switch (action.type) {
    case 'SET_BALANCE':
      return {
        value: action.payload
      }
    case 'INCREASE_BALANCE':
      return {
        ...state,
        value: state.value + action.payload
      }
    case 'DECREASE_BALANCE':
      return {
        ...state,
        value: state.value - action.payload
      }
    default:
      return state
  }
}

// Create the balance provider component
const BalanceProvider = ({ children }) => {
  const [state, dispatch] = useReducer(balanceReducer, initialState)

  // Define the set balance function
  const setBalance = (amount) => {
    dispatch({ type: 'SET_BALANCE', payload: amount })
  }

  // Define the increase balance function
  const increaseBalance = (amount) => {
    dispatch({ type: 'INCREASE_BALANCE', payload: amount })
  }

  // Define the decrease balance function
  const decreaseBalance = (amount) => {
    dispatch({ type: 'DECREASE_BALANCE', payload: amount })
  }

  // Return the provider component with the balance context value
  return (
    <BalanceContext.Provider value={{ balance: state.value, setBalance, increaseBalance, decreaseBalance }}>
      {children}
    </BalanceContext.Provider>
  )
}

// Define a custom hook for using the balance context
const useBalanceReducer = () => {
  const context = useContext(BalanceContext)
  if (context === undefined) {
    throw new Error('useBalanceReducer must be used within a BalanceProvider')
  }
  return context
}

export { BalanceProvider, useBalanceReducer }
