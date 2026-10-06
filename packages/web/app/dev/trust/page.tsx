import { notFound } from 'next/navigation';
export const dynamic = 'force-dynamic';
export default async function TrustPreviewPage() {
  if (process.env.NODE_ENV !== 'development') notFound();
  const { TrustPreview } = await import('@/components/trust-preview');
  return <TrustPreview/>;
}
