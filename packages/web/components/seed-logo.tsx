import Image from 'next/image';

export function SeedLogo({ className = '' }: { className?: string }) {
  return <Image src="/seed-logo.png" alt="" width={192} height={192} className={`seed-logo ${className}`} unoptimized />;
}
