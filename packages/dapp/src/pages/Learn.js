import Main from '../layouts/Main'

const Learn = () => {
  return (
    <Main>
      <div className='mx-auto flex flex-col px-8 md:px-0 py-16 w-full md:w-[800px] gap-y-12 text-md md:text-2xl font-garamond text-jusitifed items-center'>
        <div>
          This is all about <strong>making money weird</strong>.
        </div>
        <div>
          Honour is a peer-to-peer system of social credit. It is open: anyone can use it freely. But it is also different to what you expect.
        </div>
        <div>
          <strong>HON tokens represent obligations</strong>.
        </div>
        <div>
          The higher your balance, the <i>less creditworthy</i> you are. That said, the transaction history of any account is how we establish trust. Using HON will help you learn about the interplay between balance and history in order to cultivate meaningful, valuable kinds of trust in other people.
        </div>
        <div>
          This system works by virtue of four simple rules:
        </div>
        <ol className='list-decimal'>
          <li className='my-2'>
            All HON are the same.
          </li>
          <li className='my-2'>
            HON are created only when you accept another’s proposal.
          </li>
          <li className='my-2'>
            You can only forgive as much HON as you currently hold.
          </li>
          <li className='my-2'>
            HON are non-transferrable.
          </li>
        </ol>
        <hr className='w-2/3 mx-auto pt-6' />
        <div>
          You can learn more by clicking the button below:
        </div>
        <button
          className='w-1/4 px-4 py-2 mx-auto text-white bg-[#233447] rounded-md hover:bg-indigo-700 focus:outline-none focus:ring focus:ring-indigo-500'
        >
          <a
            href='https://kernel.community/en/tokens/token-studies/honour'
            target='_blank'
            rel='noopener noreferrer'
          >
            Learn More
          </a>
        </button>
      </div>
    </Main>
  )
}

export default Learn
