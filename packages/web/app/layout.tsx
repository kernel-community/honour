import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './style.css';
import { WalletProvider } from '@/components/wallet-provider';
const vollkorn = localFont({ src: '../public/fonts/Vollkorn.ttf', variable: '--font-heading', display: 'swap' });
export const metadata: Metadata = { title: 'Honour — money, made mutual', icons: { icon: '/seed-logo.png', apple: '/seed-logo.png' }, description: 'A little indebted to one another. Propose, honour and forgive with your community.' };
export default function Layout({ children }: { children: React.ReactNode }) {
  return <html lang="en" className={vollkorn.variable}><body><a className="skip" href="#main">Skip to content</a><WalletProvider>{children}</WalletProvider></body></html>;
}
