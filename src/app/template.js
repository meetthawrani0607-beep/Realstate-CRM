'use client';

import { motion } from 'framer-motion';

export default function RootTemplate({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ 
        type: 'spring', 
        stiffness: 200, 
        damping: 20,
        duration: 0.5 
      }}
      style={{ 
        minHeight: '100%',
        overflow: 'visible',
      }}
    >
      {children}
    </motion.div>
  );
}
