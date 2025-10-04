import { motion } from 'framer-motion';

export default function AnimatedCartoonButton({ children, className = '', ...props }) {
  return (
    <motion.button
      whileHover={{ scale: 1.08, rotate: -2 }}
      whileTap={{ scale: 0.96, rotate: 2 }}
      transition={{ type: 'spring', stiffness: 400, damping: 15 }}
      className={`rounded-full font-bold shadow-lg px-6 py-3 text-lg bg-gradient-to-r from-pink-400 via-yellow-300 to-blue-300 text-white drop-shadow-md border-2 border-white outline-none focus:ring-4 focus:ring-pink-200 transition-all ${className}`}
      {...props}
    >
      {children}
    </motion.button>
  );
}
