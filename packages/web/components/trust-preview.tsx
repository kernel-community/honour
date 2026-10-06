'use client';
import Link from 'next/link';
import { useState } from 'react';
import { trustScore, type Interaction } from '@honour/contracts/domain';
import { OfferReview, type OfferDraft } from './offer-review';
const viewer = '0x1111111111111111111111111111111111111111';
const subject = '0x2222222222222222222222222222222222222222';
const account = (n: number) => `0x${n.toString(16).padStart(40, '0')}`;
const scenarios = [
  { label: '90% · shared history', amounts: [90, 10], connected: true },
  { label: '90% · no shared history', amounts: [90, 10], connected: false },
  { label: 'Four equal sources', amounts: [25, 25, 25, 25], connected: true },
  { label: 'All from one account', amounts: [100], connected: true },
  { label: 'New account, no history', amounts: [], connected: false },
];
export function TrustPreview() {
  const [scenario, setScenario] = useState(0);
  const [draft, setDraft] = useState<OfferDraft | null>(null);
  const [message, setMessage] = useState('');
  const selected = scenarios[scenario];
  const theirs: Interaction[] = selected.amounts.map((n,i) => ({ type: 'Accepted', with: account(i+10), received:true, amount:(BigInt(n)*10n**18n).toString() }));
  if (selected.connected) theirs.push({ type:'Honoured', with:viewer, received:true, amount:'1000000000000000000' }, { type:'Honoured', with:account(10),received:false,amount:'1000000000000000000' });
  const trust = trustScore(theirs,selected.connected ? [{ type:'Honoured',with:account(10),received:true,amount:'1000000000000000000' }] : [],viewer,subject);
  function open(action: 'honour' | 'accept') { setMessage(''); setDraft({ action,recipient:subject,value:1n,amount:'10',trust }); }
  return <><header className="site-header"><Link className="wordmark" href="/">honour.</Link><Link href="/">Back to real accounts</Link></header><main id="main" className="trust-preview"><p className="preview-label">LOCAL PREVIEW · FICTIONAL DATA</p><h1>Get to know an offer.</h1><p>Try the same review flow with different forgiveness histories. No wallet is needed and no transactions can be sent here.</p><div className="preview-scenarios" aria-label="Example histories">{scenarios.map((s,i) => <button className={`button ${scenario===i?'':'quiet'}`} key={s.label} aria-pressed={scenario===i} onClick={()=>setScenario(i)}>{s.label}</button>)}</div><section className="panel preview-offer"><p className="eyebrow">EXAMPLE ACCOUNT · TRUST {trust.score}</p><h2>{selected.label}</h2><p>Choose an offer to walk through its trust context and decision.</p><div className="preview-scenarios"><button className="button" onClick={()=>open('honour')}>Review proposal</button><button className="button light" onClick={()=>open('accept')}>Review forgiveness</button></div></section>{message && <p className="notice" role="status">{message}</p>}</main><OfferReview draft={draft} busy={false} status="" error="" preview onClose={()=>setDraft(null)} onConfirm={()=>{setDraft(null);setMessage('Example complete. Nothing was signed or sent.');}}/></>;
}
