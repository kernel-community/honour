import { config } from '@/lib/config';
export function GET() { return Response.json(config(), { headers: { 'cache-control': 'no-store' } }); }
