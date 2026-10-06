'use client';
import Link from 'next/link';
import { SeedLogo } from './seed-logo';
import { TrustCard } from './trust-card';
import { OfferReview, type OfferDraft } from './offer-review';
import { useCallback, useEffect, useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { address, displayHon, parseAmount, shortAddress, type HonourEvent, type Trust } from '@honour/contracts/domain';
import type { Address, Hex } from 'viem';
import { useWallet } from './wallet-provider';
import { resolveRecipient } from '@/lib/recipient';

type Config = { contract: Address | null; chainId: number; walletReady: boolean };
type AccountData = { address: string; balance: string; history: HonourEvent[]; pending: HonourEvent[]; scores: Record<string, Trust>; trust: Trust; page: number; status: { stale: boolean; block: number } };
type Draft = OfferDraft;
const verb = { Proposed: 'Proposed HON', Honoured: 'Honoured a proposal', Forgiven: 'Offered forgiveness', Accepted: 'Accepted forgiveness' };
async function getData(who: string, viewer: string, page = 0): Promise<AccountData> {
  const response = await fetch(`/api/data?${new URLSearchParams({ address: who, viewer, page: String(page) })}`);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error ?? 'Could not load account');
  return data;
}
export default function HonourApp({ config }: { config: Config }) {
  const { connected, setConnected } = useWallet();
  const [data, setData] = useState<AccountData | null>(null);
  const [tab, setTab] = useState<'incoming' | 'outgoing' | 'history'>('incoming');
  const [action, setAction] = useState<'propose' | 'forgive'>('propose');
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [linkedRecipient, setLinkedRecipient] = useState('');
  const [draft, setDraft] = useState<Draft | null>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [dataError, setDataError] = useState('');
  const [hash, setHash] = useState<Hex | null>(null);
  const [page, setPage] = useState(0);
  const [sharing, setSharing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [inspectInput, setInspectInput] = useState('');
  const [inspected, setInspected] = useState<AccountData | null>(null);
  const [pendingId, setPendingId] = useState<Hex | null>(null);
  const generation = useRef(0);
  const who = connected?.address.toLowerCase();
  useEffect(() => { const to = new URLSearchParams(location.search).get('to'); if (to) { setRecipient(to); setLinkedRecipient(to); } }, []);
  const refresh = useCallback(async () => {
    if (!who) return;
    const epoch = generation.current;
    try { const next = await getData(who, who, page); if (epoch === generation.current) { setData(next); setDataError(''); } }
    catch (e) { if (epoch === generation.current) setDataError((e as Error).message); }
  }, [who, page]);
  useEffect(() => { void refresh(); const id = setInterval(() => void refresh(), 5000); return () => clearInterval(id); }, [refresh]);
  function disconnect() { generation.current++; setConnected(null); setData(null); setInspected(null); setDraft(null); setSharing(false); setPendingId(null); setStatus(''); setHash(null); setPage(0); }
  useEffect(() => {
    if (!connected) {
      generation.current++;
      setData(null); setInspected(null); setDraft(null); setSharing(false);
      setPendingId(null); setStatus(''); setHash(null); setPage(0);
    } else {
      setPendingId(sessionStorage.getItem(`honour:pending:${connected.address}`) as Hex | null);
    }
  }, [connected]);
  async function connect() {
    setError(''); setBusy(true);
    const epoch = generation.current;
    try {
      const { connectAccount } = await import('@/lib/wallet');
      const account = await connectAccount();
      if (epoch !== generation.current) return;
      setConnected(account); setData(null);
      setPendingId(sessionStorage.getItem(`honour:pending:${account.address}`) as Hex | null);
    } catch (e) { setError((e as Error).message.length > 200 ? 'Could not connect. Please approve the request in your wallet and try again.' : (e as Error).message); }
    finally { setBusy(false); }
  }
  async function review(event: React.FormEvent) {
    event.preventDefault(); setError(''); setBusy(true);
    try {
      const to = await resolveRecipient(recipient, !!linkedRecipient && recipient === linkedRecipient); const value = parseAmount(amount);
      if (to.toLowerCase() === who) throw new Error('Choose someone other than yourself.');
      if (action === 'forgive') {
        const response = await fetch(`/api/data?${new URLSearchParams({ address: who!, forgiveTo: to })}`);
        const allowance = await response.json();
        if (!response.ok || typeof allowance.available !== 'string' || typeof allowance.recipientBalance !== 'string') throw new Error('Could not check your remaining forgiveness. Please try again.');
        if (value > BigInt(allowance.available)) throw new Error(`You can offer ${displayHon(allowance.available)} more HON of forgiveness to this person. Earlier offers count towards this limit, even after acceptance.`);
        if (value > BigInt(allowance.recipientBalance)) throw new Error(`This person currently holds ${displayHon(allowance.recipientBalance)} HON. You cannot forgive more than that.`);
      }
      const other = await getData(to, who!);
      setDraft({ action, recipient: to, value, amount: displayHon(value), trust: other.trust });
    } catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  }
  async function submit() {
    if (!draft || !connected || !config.contract) return;
    setBusy(true); setError(''); setHash(null);
    const epoch = generation.current;
    try {
      const { sendHonour } = await import('@/lib/wallet');
      const receipt = await sendHonour(connected, config.contract, draft.action, draft.recipient, draft.value, setStatus);
      if (epoch === generation.current) { setHash(receipt); setStatus('Confirmed. A little more connected.'); setDraft(null); setAmount(''); await refresh(); }
    } catch (e) { setError((e as Error).message.length > 250 ? 'The request did not complete. Check your wallet and try again.' : (e as Error).message); setStatus(''); setDraft(null); }
    finally { setBusy(false); setPendingId(sessionStorage.getItem(`honour:pending:${connected.address}`) as Hex | null); }
  }
  async function checkPending() {
    if (!connected || !pendingId) return;
    setBusy(true); setError(''); setStatus('Checking your operation');
    try { const { waitForHonour } = await import('@/lib/wallet'); setHash(await waitForHonour(connected, pendingId)); setStatus('Confirmed.'); await refresh(); }
    catch (e) { setError((e as Error).message); setStatus(''); }
    finally { setBusy(false); setPendingId(sessionStorage.getItem(`honour:pending:${connected.address}`) as Hex | null); }
  }
  async function inspect(event: React.FormEvent) {
    event.preventDefault(); setError(''); setBusy(true);
    try { const to = await resolveRecipient(inspectInput); setInspected(await getData(to, who ?? to)); }
    catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  }
  const offers = (data?.pending ?? []).filter(e => tab === 'incoming' ? e.to === who : e.from === who);
  const incoming = data?.pending.filter(e => e.to === who).length ?? 0;
  const ready = !!connected && !!config.contract && !busy && !pendingId;
  return <>
    <header className="site-header"><Link className="wordmark" href="/" aria-label="Honour home"><SeedLogo className="brand-symbol"/> honour<span className="brand-period">.</span></Link>
      <nav><Link href="/learn">The idea</Link>{connected ? <button className="button quiet" onClick={disconnect}>Disconnect</button> : <button className="button small" onClick={connect} disabled={busy || !config.walletReady}>{busy ? 'Connecting…' : 'Connect'}</button>}</nav></header>
    <main id="main">
      <section className="intro"><div><p className="eyebrow"><SeedLogo className="tiny-seed"/> MONEY, MADE MUTUAL</p><h1>A little indebted.<br/><em>A lot connected.</em></h1><p className="lede">Honour is money for the relationships that matter.</p></div>
        <div className="orbit" aria-hidden="true"><div className="orbit-circle one"/><div className="orbit-circle two"/><div className="orbit-circle three"/><span className="orbit-label">WHAT YOU OWE MAKES US<br/>ALL BETTER MONEY.</span><SeedLogo className="orbit-seed"/></div></section>
      <div className="section-line"><span>A SMALL PRACTICE IN TRUST</span><span>01 — YOUR CORNER OF THE COMMONS</span></div>
      {!config.contract && <p className="notice">A new chapter of Honour is taking shape. <Link href="/learn">Explore the idea</Link> while we get ready to open.</p>}
      <div className="dashboard">
        <aside className="balance-card"><p className="eyebrow">YOUR OPEN PROMISES</p><div className="balance">{data ? displayHon(data.balance) : connected ? '…' : '—'}<span>HON</span></div>
          <p>A balance of responsibility.<br/>A reason to stay in touch.</p><div className="balance-divider"/>
          {connected ? <><span className="account-label">YOUR HONOUR ACCOUNT</span><button className="address-button" onClick={() => setSharing(!sharing)}>{shortAddress(connected.address)} <span>↗</span></button>
            {sharing && <div className="share"><QRCodeSVG value={`${location.origin}/?to=${connected.address}`} size={150} bgColor="#ffffff" fgColor="#233447"/><p className="full-address">{connected.address}</p><button className="button light" onClick={async () => { try { await navigator.clipboard.writeText(`${location.origin}/?to=${connected.address}`); setCopied(true); } catch { setError('Could not copy. Select the address above to copy it.'); } }}>{copied ? 'Copied ✓' : 'Copy receiving link'}</button></div>}</> : <><button className="button light" onClick={connect} disabled={busy || !config.walletReady}>Find your place <span>↗</span></button><small>Your own account.<br/>One less thing between you and someone else.</small></>}
          <SeedLogo className="balance-seed"/>
        </aside>
        <section className="inbox panel"><div className="panel-heading"><div><p className="eyebrow">GIVE & RECEIVE</p><h2>Your conversations</h2></div><span className="counter">{incoming.toString().padStart(2, '0')}</span></div>
          <div className="tabs" role="tablist" aria-label="Conversations">{(['incoming', 'outgoing', 'history'] as const).map(t => <button key={t} role="tab" aria-selected={tab === t} onClick={() => { setTab(t); setPage(0); }}>{t === 'incoming' ? 'For you' : t === 'outgoing' ? 'From you' : 'History'}{t === 'incoming' && incoming > 0 ? ` (${incoming})` : ''}</button>)}</div>
          {dataError ? <div className="empty"><p>{dataError}</p><button className="text-button" onClick={() => void refresh()}>Try again ↗</button></div> : !connected ? <div className="empty"><span className="empty-art" aria-hidden>↗<span>↙</span></span><h3>Every relationship starts somewhere.</h3><p>Connect to see proposals and forgiveness<br/>from your community.</p><Link href="/learn">A few wonderfully weird rules ↗</Link></div> : !data ? <div className="empty" role="status">Finding your conversations…</div> : tab === 'history' ? <>
            {data.history.length ? data.history.map(e => <div className="history-row" key={`${e.hash}:${e.logIndex}`}><div><strong>{verb[e.type]}</strong><p>{e.from === who ? 'With' : 'From'} {shortAddress(e.from === who ? e.to : e.from)} · {new Date(e.timestamp * 1000).toLocaleDateString()}</p></div><a target="_blank" rel="noreferrer" href={`https://etherscan.io/tx/${e.hash}`}>{displayHon(e.amount)} HON ↗</a></div>) : <div className="empty"><h3>A fresh beginning.</h3><p>Your shared history will grow here.</p></div>}
            <div className="pagination"><button disabled={page === 0} onClick={() => setPage(page - 1)}>← Newer</button><span>Page {page + 1}</span><button disabled={data.history.length < 30} onClick={() => setPage(page + 1)}>Older →</button></div></> : offers.length ? offers.map(e => <article className="offer" key={`${e.type}:${e.offerId}`}><div className="offer-top"><span className={`pill ${e.type === 'Forgiven' ? 'forgiveness' : ''}`}>{e.type === 'Proposed' ? 'Proposal' : 'Forgiveness'}</span><strong>{displayHon(e.amount)} <small>HON</small></strong></div><p><b>{shortAddress(e.from === who ? e.to : e.from)}</b> {e.from === who ? 'has your offer.' : e.type === 'Proposed' ? 'invites you to take on a promise.' : 'offers to release part of your obligation.'}</p><p className="offer-trust-summary"><strong>Trust {data.scores[e.from === who ? e.to : e.from]?.score ?? '—'}</strong><span>Review their connections and context before accepting.</span></p>{e.to === who && <button className="button small" disabled={!ready} onClick={() => setDraft({ action: e.type === 'Proposed' ? 'honour' : 'accept', recipient: address(e.from), value: BigInt(e.offerId), amount: displayHon(e.amount), trust: data.scores[e.from] })}>{e.type === 'Proposed' ? 'Review proposal' : 'Review forgiveness'} ↗</button>}</article>) : <div className="empty"><SeedLogo className="empty-seed"/><h3>{tab === 'incoming' ? 'A little room for possibility.' : 'Reach out. Start something.'}</h3><p>{tab === 'incoming' ? 'You’re all caught up. New offers will find you here.' : 'Your open proposals and forgiveness offers appear here.'}</p></div>}
          {data?.status.stale && <p className="notice">History is temporarily out of date. We’re trying again.</p>}
        </section>
      </div>
      {(error || status || pendingId) && <div className="action-notices">
      {error && <div className="notice error" role="alert">{error}<button aria-label="Dismiss error" onClick={() => setError('')}>×</button></div>}
      {status && <div className="notice success" role="status">{status} {hash && <a target="_blank" rel="noreferrer" href={`https://etherscan.io/tx/${hash}`}>View transaction ↗</a>}</div>}
      {pendingId && <div className="notice">You have an operation awaiting a result. <button onClick={checkPending} disabled={busy}>Check confirmation</button></div>}
      </div>}
      <div className="lower-grid"><section className="panel compose" id="give"><p className="eyebrow">MAKE THE FIRST MOVE</p><h2>What can we do for each other?</h2><div className="segmented"><button aria-pressed={action === 'propose'} onClick={() => setAction('propose')}>Propose HON <span>↗</span></button><button aria-pressed={action === 'forgive'} onClick={() => setAction('forgive')}>Offer forgiveness <span>↘</span></button></div><p className="form-description">{action === 'propose' ? 'Invite someone to accept a responsibility. HON is created only when they say yes.' : 'Offer to release some of someone’s responsibility. Their balance falls when they accept.'}</p>
          <form onSubmit={review}><label htmlFor="recipient">Who’s on the other side?</label><input id="recipient" placeholder="Their wallet address, ENS name or receiving link" value={recipient} onChange={e => { setRecipient(e.target.value); setLinkedRecipient(''); }} required autoComplete="off" spellCheck={false}/><small>Wallet addresses and ENS names find their Honour account automatically.</small><label htmlFor="amount">How much HON?</label><div className="amount-input"><input id="amount" inputMode="decimal" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} required autoComplete="off"/><span>HON</span></div><button className="button" disabled={!ready} type="submit">{action === 'propose' ? 'Review proposal' : 'Review forgiveness'} <span>↗</span></button>{!connected && <small>Connect your account to make an offer.</small>}</form>
        </section><section className="panel relationships"><p className="eyebrow">TRUST IS PERSONAL</p><h2>A familiar face.<br/>A shared connection.</h2><p>See someone through the relationships you share. Their history means something different to each of us.</p><form onSubmit={inspect}><label htmlFor="inspect">Look up an Honour account</label><div className="lookup"><input id="inspect" placeholder="Wallet address, ENS or receiving link" value={inspectInput} onChange={e => setInspectInput(e.target.value)} required/><button aria-label="Look up account" disabled={busy || !config.contract}>↗</button></div></form>{inspected && <div className="inspection"><p className="full-address">{inspected.address}</p><h3>{displayHon(inspected.balance)} HON</h3>{who ? <TrustCard trust={inspected.trust}/> : <p>Connect to see trust from your perspective.</p>}<p>{inspected.history.length ? 'Recent shared history' : 'Their story is just beginning.'}</p>{inspected.history.slice(0, 3).map(e => <p key={`${e.hash}:${e.logIndex}`} className="mini-event">{verb[e.type]} <b>{displayHon(e.amount)} HON</b></p>)}</div>}<div className="quote"><span>“</span><p>One way of defining community is a group of people who are all a little bit indebted to each other.</p><Link href="/learn">Explore the thinking ↗</Link></div></section></div>
      <section className="closing"><SeedLogo className="closing-seed"/><p>Not more to accumulate.<br/><em>More reasons to connect.</em></p></section>
    </main><footer><Link className="wordmark" href="/">honour.</Link><p>A small experiment in being there for each other.</p><a href="https://www.kernel.community/en/tokens/token-studies/honour" target="_blank" rel="noreferrer">Grown in Kernel ↗</a></footer>
    <OfferReview draft={draft} busy={busy} status={status} error={error} onClose={() => setDraft(null)} onConfirm={submit}/>

  </>;
}
