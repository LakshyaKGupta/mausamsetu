import React from 'react'
import { motion } from 'framer-motion'

type RevealVariant = 'default' | 'stagger' | 'left' | 'scale'

interface SectionRevealProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: RevealVariant
  delay?: number
  threshold?: number
}

const variantsMap = {
  default: {
    initial: { opacity: 0, y: 24 },
    animate: { opacity: 1, y: 0 },
  },
  stagger: {
    initial: { opacity: 0, y: 18 },
    animate: { opacity: 1, y: 0 },
  },
  left: {
    initial: { opacity: 0, x: -24 },
    animate: { opacity: 1, x: 0 },
  },
  scale: {
    initial: { opacity: 0, scale: 0.96, y: 14 },
    animate: { opacity: 1, scale: 1, y: 0 },
  },
}

export const SectionReveal: React.FC<SectionRevealProps> = ({
  children,
  className = '',
  variant = 'default',
  delay = 0,
  threshold = 0.1,
  ...rest
}) => {
  const selected = variantsMap[variant] || variantsMap.default

  return (
    <motion.div
      initial={selected.initial}
      whileInView={selected.animate}
      viewport={{ once: true, amount: threshold }}
      transition={{
        duration: 0.6,
        delay: delay / 1000,
        ease: [0.16, 1, 0.3, 1],
      }}
      className={className}
      {...(rest as any)}
    >
      {children}
    </motion.div>
  )
}
