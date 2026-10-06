import { config } from '@/lib/config';
export const runtime = 'nodejs';
export async function GET(request: Request) {
  try {
    const base = process.env.INDEXER_URL, token = process.env.INDEXER_TOKEN;
    if (!base || !token || !config().contract) return Response.json({ error: 'Honour is getting ready. Account data will be available soon.' }, { status: 503 });
    const query = new URL(request.url).searchParams;
    const target = new URL(query.has('name') ? 'resolve' : query.has('forgiveTo') ? 'allowance' : 'account', `${base.replace(/\/$/, '')}/`);
    for (const key of ['address', 'viewer', 'page', 'name', 'forgiveTo']) if (query.has(key)) target.searchParams.set(key, query.get(key)!);
    const response = await fetch(target, { headers: { authorization: `Bearer ${token}` }, cache: 'no-store', signal: AbortSignal.timeout(15_000) });
    if (!response.ok) throw new Error('Unavailable');
    const data = await response.json();
    if (!query.has('name')) {
      const cfg = config();
      if (data.status?.chainId !== cfg.chainId || data.status?.contract?.toLowerCase() !== cfg.contract?.toLowerCase()) throw new Error('Deployment mismatch');
    }
    return Response.json(data, { headers: { 'cache-control': 'no-store' } });
  } catch { return Response.json({ error: 'We could not reach Honour’s history. Please try again shortly.' }, { status: 503 }); }
}
