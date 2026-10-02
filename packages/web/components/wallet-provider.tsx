'use client';
import { createContext, useContext, useEffect, useState, type Dispatch, type SetStateAction } from 'react';
import type { Connected } from '@/lib/wallet';

const WalletContext = createContext<{ connected: Connected | null; setConnected: Dispatch<SetStateAction<Connected | null>> } | null>(null);

// The root layout survives navigation, so the wallet does too. Keep listening
// while reading /learn so account or network changes still invalidate it.
export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [connected, setConnected] = useState<Connected | null>(null);
  useEffect(() => {
    const provider = connected?.provider;
    const changed = () => setConnected(null);
    provider?.on?.('accountsChanged', changed);
    provider?.on?.('chainChanged', changed);
    return () => {
      provider?.removeListener?.('accountsChanged', changed);
      provider?.removeListener?.('chainChanged', changed);
    };
  }, [connected]);
  return <WalletContext.Provider value={{ connected, setConnected }}>{children}</WalletContext.Provider>;
}
export function useWallet() {
  const wallet = useContext(WalletContext);
  if (!wallet) throw new Error('WalletProvider is missing');
  return wallet;
}
