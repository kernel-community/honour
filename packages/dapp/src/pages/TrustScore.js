import Main from '../layouts/Main'

const TrustScore = () => {
  return (
    <Main>
      <div className='mx-auto flex flex-col px-8 mt-20 md:px-0 py-16 w-full md:w-[800px] gap-y-12 text-md md:text-2xl font-garamond text-jusitifed items-center'>
        <div>
          What is trust? This is a question we begin Kernel with...
        </div>
        <button
          className='w-1/4 px-4 py-2 mx-auto text-white bg-[#233447] rounded-md hover:bg-indigo-700 focus:outline-none focus:ring focus:ring-indigo-500'
        >
          <a
            href='https://kernel.community/en/learn/module-0/trust/'
            target='_blank'
            rel='noopener noreferrer'
          >
            Read
          </a>
        </button>
        <div>
          Honour explores this question in code.
          We want to determine the trust score of any account you transact with
          <strong> from your perspective</strong>.
        </div>
        <div>
          <strong>There is no global trust score</strong>. Different accounts will have different scores
          depending on who is looking at them. This is how the world works.
          You trust Alice more than I, while I trust Charlie more than you.
        </div>
        <div>
          Trust scores are also not a % or some score "out of" 10. There is no limit to what a trust score can be.
          Red suggests untrusted. Yellow suggests some trust. Green suggests trusted. You can also consider trust in tandem with creditworthiness.
          The higher the balance of the account you're interacting with, the <strong>less creditworthy</strong> it is.
        </div>
        <div>
          We are playing infinitely principled games with one another. This is not an assessment. It is a contextual
          observation based on open source code anyone can look at, learn about, discuss, improve, and/or fork.
        </div>
        <div>
          <strong>This is how it currently works</strong>:
        </div>
        <ol className='list-decimal'>
          <li className='my-2'>
            If you have transacted HON before with the account you're Honouring a Proposal, or Accepting Forgiveness, from: <strong>+2</strong>
          </li>
          <li className='my-2'>
            If the account you're transacting with has either proposed an amount more than 100 times larger than its average proposal,
            or accepted forgiveness that is more than 100 times its average: <strong>-1</strong>
          </li>
        </ol>
        <div>
          We plan to implement:
        </div>
        <ol className='list-decimal'>
          <li className='my-2'>
            Nested trust graphs (has the account interacted with accounts you've interacted with? +1 per account)
          </li>
          <li className='my-2'>
            More contextual checks like (2) above. What kinds of behaviour are really malicious in this system? Let's experiment and see!
          </li>
        </ol>
        <hr className='w-2/3 mx-auto pt-6' />
        <div>
          You can verify how we calculate this score by clicking the button below:
        </div>
        <button
          className='w-1/4 px-4 py-2 mx-auto text-white bg-[#233447] rounded-md hover:bg-indigo-700 focus:outline-none focus:ring focus:ring-indigo-500'
        >
          <a
            href='https://github.com/kernel-community/honour/blob/main/packages/dapp/src/hooks/calculateTrustScore.js'
            target='_blank'
            rel='noopener noreferrer'
          >
            See the code
          </a>
        </button>
      </div>
    </Main>
  )
}

export default TrustScore
