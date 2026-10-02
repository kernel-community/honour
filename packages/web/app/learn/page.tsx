import Link from 'next/link';
import { SeedLogo } from '@/components/seed-logo';
export const dynamic = 'force-dynamic';
export default function Learn() {
  return <><header className="site-header"><Link className="wordmark" href="/"><SeedLogo className="brand-symbol"/> honour.</Link><Link href="/">Back to your community ↗</Link></header><main id="main" className="essay"><p className="eyebrow">MONEY, MADE MUTUAL</p><h1>What if money<br/><em>meant a promise?</em></h1><p>Honour is a small experiment in social credit. Holding HON represents an obligation, a reason to keep showing up for one another. It is not a token to trade or a balance to accumulate.</p><h2>Four wonderfully weird rules.</h2><ol><li>All HON are the same.</li><li>HON is created only when you accept someone else’s proposal.</li><li>You can offer to forgive as much HON as you currently hold, up to the other person’s balance.</li><li>HON cannot be transferred, and nobody can be approved to transfer it for you.</li></ol><h2>Two conversations.</h2><p><strong>Propose → honour.</strong> You offer a responsibility; the other person decides whether to accept it. Accepting creates HON in their account. Your balance stays the same.</p><p><strong>Forgive → accept.</strong> You offer to release part of someone’s obligation; they choose whether to accept. Acceptance burns their HON. Your balance stays the same. Your eligibility to make the offer is checked when you offer it.</p><p>A zero balance isn’t the goal. Relationships give these promises meaning.</p><h2 id="trust">What is trust?</h2>
      <p><a href="https://kernel.community/en/learn/module-0/trust/" target="_blank" rel="noreferrer">Explore the question ↗</a></p>
      <p>Honour explores this question in code. We want to understand the trust of any account you interact with <strong>from your perspective</strong>.</p>
      <p><strong>There is no global trust score.</strong> Different accounts have different scores depending on who is looking. You trust Alice more than I do, while I trust Charlie more than you do.</p>
      <p>A trust score is not a percentage or a score out of ten. There is no upper limit. Red suggests little trust, yellow some trust, and green more trust, based on your shared history.</p>
      <p>You can also consider the account’s balance: more HON means more outstanding responsibility. That gives context to a new proposal; it does not, by itself, tell you whether someone will fulfil it.</p>
      <p>We are playing infinitely principled games with one another. This is a contextual observation, not a judgement of a person. The code is open for anyone to examine, discuss, improve or fork.</p>
      <p><strong>Here is how the score works:</strong></p>
      <ul>
        <li><strong>+2</strong> each time the other account has honoured your proposal, offered you forgiveness or accepted your forgiveness.</li>
        <li><strong>+1</strong> for each pair of interactions you and the other account have had with the same account. Repeated interactions count: if you have each interacted with someone twice, that adds four points.</li>
        <li><strong>−1</strong> if any of the other account’s actions involved more than 100 times their average amount, and <strong>−1</strong> for each acceptance of forgiveness above that threshold. The average includes proposals they made, proposals they honoured, forgiveness they offered and forgiveness they accepted.</li>
      </ul>
      <p>These are starting points for an experiment. What kinds of behaviour matter in this system? Let’s explore that together. Open a trust score to see how shared interactions, direct relationships and unusual amounts contribute.</p>
      <p><a href="https://www.kernel.community/en/tokens/token-studies/honour" target="_blank" rel="noreferrer">Read the original Honour essay ↗</a></p><Link className="button" href="/">Make money a little weird ↗</Link></main></>;
}
