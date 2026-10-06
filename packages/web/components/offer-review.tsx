'use client';
import { useEffect, useRef, useState } from 'react';
import type { Address } from 'viem';
import type { Trust } from '@honour/contracts/domain';
import { TrustCard } from './trust-card';
export type OfferDraft = { action: 'propose' | 'forgive' | 'honour' | 'accept'; recipient: Address; value: bigint; amount: string; trust?: Trust };
export function OfferReview({ draft, busy, status, error, onClose, onConfirm, preview = false }: {
  draft: OfferDraft | null; busy: boolean; status: string; error: string; onClose: () => void; onConfirm: () => void; preview?: boolean;
}) {
  const modal = useRef<HTMLDialogElement>(null);
  const [step, setStep] = useState<'context' | 'confirm'>('context');
  const incoming = draft?.action === 'honour' || draft?.action === 'accept';
  useEffect(() => {
    if (draft) { setStep(draft.action === 'honour' || draft.action === 'accept' ? 'context' : 'confirm'); modal.current?.showModal(); }
    else modal.current?.close();
  }, [draft]);
  return <dialog className="offer-dialog" ref={modal} aria-labelledby="offer-review-title" onCancel={e => { if (busy) e.preventDefault(); else onClose(); }} onClose={() => { if (!busy) onClose(); }}><div className="dialog-inner">
    <button className="close" disabled={busy} onClick={onClose} aria-label="Close review">×</button>
    {preview && <p className="preview-label">FICTIONAL EXAMPLE · NO TRANSACTIONS</p>}
    {incoming && <p className="review-step">{step === 'context' ? '1 · Understand the offer' : '2 · Your decision'}</p>}
    <h2 id="offer-review-title">{incoming && step === 'context' ? 'Before you say yes.' : draft?.action === 'propose' ? 'You are proposing:' : draft?.action === 'forgive' ? 'A little forgiveness.' : draft?.action === 'honour' ? 'Honour this promise?' : 'Accept this forgiveness?'}</h2>
    {incoming && step === 'context' ? <><p className="offer-context-intro">{draft?.action === 'honour' ? `You have been offered a proposal for ${draft.amount} HON. Accepting adds this responsibility to your balance.` : `You have been offered ${draft?.amount} HON of forgiveness. Accepting reduces your balance.`}</p><TrustCard trust={draft?.trust}/></> : <><div className="review-amount">{draft?.amount} <small>HON</small></div><p>{draft?.action === 'propose' ? 'Their balance increases only if they accept.' : draft?.action === 'forgive' ? 'Their balance decreases only if they accept. Your balance stays the same.' : draft?.action === 'honour' ? 'Your balance increases by this amount.' : 'Your balance decreases by this amount.'}</p></>}
    {error && <p role="alert">{error}</p>}
    <div className="review-actions">{incoming && step === 'confirm' && <button className="button quiet" disabled={busy} onClick={() => setStep('context')}>Back to context</button>}<button className="button" disabled={busy} onClick={() => incoming && step === 'context' ? setStep('confirm') : onConfirm()}>{busy ? status || 'Please wait…' : incoming && step === 'context' ? 'Continue' : preview ? 'Finish example' : 'Confirm in my wallet'}</button><button className="text-button" disabled={busy} onClick={onClose}>Not now</button></div>
    {incoming && <p className="review-note">Not now leaves the offer in your inbox. Nothing is sent until you confirm in your wallet.</p>}
  </div></dialog>;
}
