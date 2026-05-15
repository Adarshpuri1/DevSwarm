// frontend/src/animations/variants.js

export const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

export const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.96 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: [0.23, 1, 0.32, 1] } },
  hover: { y: -2, scale: 1.01, transition: { duration: 0.2 } },
  tap: { scale: 0.98 },
};

export const messageBubble = {
  hidden: { opacity: 0, x: -12, scale: 0.95 },
  visible: { opacity: 1, x: 0, scale: 1, transition: { duration: 0.3, ease: 'easeOut' } },
  exit: { opacity: 0, scale: 0.9, transition: { duration: 0.15 } },
};

export const pipelineStep = {
  pending: { scale: 1, opacity: 0.5 },
  active: { scale: [1, 1.1, 1], opacity: 1, transition: { repeat: Infinity, duration: 1.5 } },
  done: { scale: 1, opacity: 1, transition: { type: 'spring', stiffness: 300 } },
};

export const gradientShift = {
  animate: {
    backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
    transition: { duration: 4, ease: 'linear', repeat: Infinity },
  },
};

export const slideIn = {
  hidden: { x: -20, opacity: 0 },
  visible: { x: 0, opacity: 1, transition: { duration: 0.4, ease: [0.23, 1, 0.32, 1] } },
};

export const fadeUp = {
  hidden: { y: 16, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 0.4 } },
};
