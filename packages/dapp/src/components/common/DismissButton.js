import { motion } from 'framer-motion'

const DismissButton = ({
  exec,
  text,
  bringToFront = false
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 50 }}
      transition={{ duration: 0.2, type: 'tween' }}
      onClick={exec}
      className={`sm:w-32 sm:px-4 sm:py-2 w-24 px-2 py-1 border-2 border-gray-200 rounded-md hover:border-gray-400 transition-all cursor-pointer flex justify-center ${bringToFront ? 'z-[50]' : ''}`}
    >
      {text}
    </motion.div>
  )
}
export default DismissButton
