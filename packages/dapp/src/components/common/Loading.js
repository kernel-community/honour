import { motion } from 'framer-motion'
import KernelLogo from '../../images/kernel_logo.png'

const Loading = ({ text }) => {
  return (
    <div className='md:p-8 w-full h-min-content md:w-80 my-auto mx-auto bg-white font-volkhorn text-lg text-center flex flex-col items-center py-6 sm:py-0'>
      <div className='w-64 h-64 relative flex justify-center items-center'>
        <motion.span
          className='animate-pulse block w-64 h-64 border-4 border-gray-300 border-t-[#07eb9f] rounded-full absolute top-0 left-0'
          animate={{ rotate: 360 }}
          transition={{
            loop: Infinity,
            ease: 'linear',
            duration: 1
          }}
        />
        <div>
          <img className='w-32 h-32' src={KernelLogo} alt='kernel logo' />
        </div>
      </div>
      <div className='mt-10 text-xl'>
        {text || 'Loading'}
      </div>
    </div>
  )
}

export default Loading
