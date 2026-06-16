'use client';

import { motion } from 'framer-motion';
import { usePathname } from 'next/navigation';

export default function DashboardTemplate({ children }) {
  const pathname = usePathname();

  return (
    <motion.div
      key={pathname}
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        type: 'spring', 
        stiffness: 260, 
        damping: 22, 
        mass: 0.8,
      }}
      style={{ 
        minHeight: 0,
        flex: '1 1 0%',
        overflow: 'visible',
      }}
    >
      {children}
    </motion.div>
  );
}
