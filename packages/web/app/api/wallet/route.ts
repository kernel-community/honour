import { cookies } from 'next/headers';
import { config } from '@/lib/config';
import { checkTicket, issueTicket, validateAccount, validatePrepare } from '@/lib/proxy-policy';

export const runtime = 'nodejs';
const rates = new Map<string, { count: number; reset: number }>();
const limit = (key: string) => {
  const now = Date.now();
  if (rates.size > 2000) for (const [k, v] of rates) if (v.reset < now) rates.delete(k);
  const current = rates.get(key);
  if (!current || current.reset < now) { if (rates.size > 4000) return false; rates.set(key, { count: 1, reset: now + 60_000 }); return true; }
  return ++current.count <= 90;
};
export async function POST(request: Request) {
  let id: unknown = null;
  const fail = (message: string, status = 400) => Response.json({ jsonrpc: '2.0', id, error: { code: -32000, message } }, { status, headers: { 'cache-control': 'no-store' } });
  try {
    const origin = request.headers.get('origin');
    // Next's internal URL can use localhost even when the browser uses 127.0.0.1.
    // Compare against the incoming Host, preserving the protocol and port.
    const publicUrl = new URL(request.url);
    const host = request.headers.get('host');
    if (host) publicUrl.host = host;
    if (origin !== publicUrl.origin) return fail('Invalid origin', 403);
    if (!limit(request.headers.get('x-vercel-forwarded-for') ?? request.headers.get('x-forwarded-for') ?? 'local')) return fail('Please wait a moment before retrying.', 429);
    if (Number(request.headers.get('content-length') ?? '0') > 65536) return fail('Request too large', 413);
    const raw = await request.text(); if (raw.length > 65536) return fail('Request too large', 413);
    const body = JSON.parse(raw);
    if (!body || Array.isArray(body) || body.jsonrpc !== '2.0' || !Array.isArray(body.params) || body.params.length !== 1) return fail('Invalid request');
    id = typeof body.id === 'number' || typeof body.id === 'string' ? body.id : null;
    const cfg = config();
    const key = process.env.ALCHEMY_API_KEY, policy = process.env.ALCHEMY_PAYMASTER_POLICY_ID, secret = process.env.WALLET_PROXY_SECRET;
    if (!cfg.contract || !cfg.walletReady || !key || !policy || !secret || secret.length < 32) return fail('Accounts are not available yet.', 503);
    if (process.env.NODE_ENV === 'production' && process.env.SPONSORSHIP_LIMITS_CONFIGURED !== 'true') return fail('Please try again shortly.', 503);
    const jar = await cookies();
    let params: unknown;
    switch (body.method) {
      case 'wallet_requestAccount': params = validateAccount(body.params[0]); break;
      case 'wallet_prepareCalls': params = validatePrepare(body.params[0], cfg.contract, policy); break;
      case 'wallet_sendPreparedCalls':
        checkTicket(body.params[0], jar.get('honour-prepared')?.value ?? '', secret);
        params = body.params[0]; break;
      case 'wallet_getCallsStatus':
        if (typeof body.params[0] !== 'string' || !/^0x[0-9a-fA-F]{1,512}$/.test(body.params[0])) return fail('Invalid call ID');
        params = body.params[0]; break;
      default: return fail('Unsupported method');
    }
    const response = await fetch('https://api.g.alchemy.com/v2', { method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${key}` },
      body: JSON.stringify({ jsonrpc: '2.0', id, method: body.method, params: [params] }), cache: 'no-store', signal: AbortSignal.timeout(20_000) });
    if (!response.ok) return fail('Account service unavailable. Please retry.', 502);
    const data = await response.json();
    if (data.error || !data.result) return fail('Could not complete this request. Check the recipient and available HON, then try again.', 502);
    // Never relay provider diagnostics/configuration that may include credentials.
    const serialized = JSON.stringify(data.result);
    if (serialized.includes(key) || serialized.includes(policy)) return fail('Unexpected account response.', 502);
    if (body.method === 'wallet_prepareCalls') jar.set('honour-prepared', issueTicket(data.result, secret), { httpOnly: true, sameSite: 'strict', secure: new URL(request.url).protocol === 'https:', path: '/api/wallet', maxAge: 600 });
    return Response.json({ jsonrpc: '2.0', id, result: data.result }, { headers: { 'cache-control': 'no-store' } });
  } catch { return fail('Request could not be completed. Please try again.'); }
}
