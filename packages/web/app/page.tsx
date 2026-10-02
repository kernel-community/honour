import HonourApp from '@/components/honour-app';
import { config } from '@/lib/config';
export const dynamic = 'force-dynamic';
export default function Home() { return <HonourApp config={config()} />; }
