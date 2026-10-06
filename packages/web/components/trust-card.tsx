import Link from 'next/link';
import { displayHon, type Trust } from '@honour/contracts/domain';

export function TrustCard({ trust }: { trust?: Trust }) {
  if (!trust?.forgiveness) return <p>Trust context is unavailable. You can come back when it has loaded.</p>;
  const f = trust.forgiveness;
  const known = f.knownSourceCount ?? 0;
  return <section className="trust-profile" aria-label="Trust from your perspective">
    <div className="trust-overview"><strong className="trust-number">{trust.score}</strong><div><p className="eyebrow">TRUST FROM YOUR PERSPECTIVE</p><h3>{trust.score === 0 ? 'A new connection' : 'A little shared history'}</h3><p>{trust.score === 0 ? 'No shared evidence yet. That does not mean they are untrustworthy.' : 'A view of your relationships, not a rating out of ten.'}</p></div></div>
    <div className="trust-evidence"><div><b>+{trust.shared}</b><h4>{trust.shared} shared {trust.shared === 1 ? 'account' : 'accounts'}</h4><p>You have each taken part in an honoured proposal with these accounts. Each counts once.</p></div><div><b>+{trust.direct}</b><h4>{trust.direct ? 'They have honoured your proposal' : 'No proposal honoured with you yet'}</h4><p>They have accepted responsibility you proposed. This contributes two points once.</p></div></div>
    <section className={`forgiveness-context${known > 0 ? ' has-shared-history' : ''}`}><p className="eyebrow">FORGIVENESS HISTORY</p>{f.acceptedCount ? <><h3>{f.largestPercent}% from one account</h3><div className="concentration-bar" role="img" aria-label={`${f.largestPercent}% of accepted forgiveness from the largest source`}><span style={{ width: `${f.largestPercent}%` }}/></div><p>{displayHon(f.total)} HON forgiven across {f.acceptedCount} accepted {f.acceptedCount === 1 ? 'offer' : 'offers'}, from {f.sourceCount} {f.sourceCount === 1 ? 'account' : 'accounts'}. The largest source provided {displayHon(f.largest)} HON.</p><p className="forgiveness-connections"><strong>{known} of these {f.sourceCount} {f.sourceCount === 1 ? 'accounts has' : 'accounts have'} also interacted with you.</strong></p><p className="muted">Who has forgiven HON is a strong signal of trustworthiness. But the signal is nuanced. We show how many accounts have forgiven this one, and if any of them have transacted with you.</p></> : <><h3>No accepted forgiveness yet</h3><p>There is no forgiveness history to compare. 0 forgiving accounts have also interacted with you.</p></>}</section>
    <p className="trust-footnote">Different accounts may belong to one person. These records cannot tell you whether a real-world promise was fulfilled. <Link href="/learn#trust">How trust works</Link></p>
  </section>;
}
