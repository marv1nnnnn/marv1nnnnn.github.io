'use client';

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { usePathname } from 'next/navigation';

export default function RouteTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const reducedMotion = useReducedMotion();

  return (
    <AnimatePresence mode="wait" initial={!reducedMotion}>
      <motion.div
        key={pathname}
        className="route-transition"
        initial={{ opacity: reducedMotion ? 1 : 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: reducedMotion ? 1 : 0 }}
        transition={{ duration: reducedMotion ? 0 : 0.22 }}
      >
        {!reducedMotion && (
          <motion.div
            className="route-transition__veil"
            initial={{ scaleY: 1 }}
            animate={{ scaleY: 0 }}
            transition={{ duration: 0.72, ease: [0.76, 0, 0.24, 1], delay: 0.06 }}
            aria-hidden="true"
          />
        )}
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
