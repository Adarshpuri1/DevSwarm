// frontend/src/animations/gsap.js
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
gsap.registerPlugin(ScrollTrigger);

export const animateAgentCards = (targets) => {
  gsap.fromTo(targets,
    { opacity: 0, x: -30, scale: 0.95 },
    { opacity: 1, x: 0, scale: 1, duration: 0.5, stagger: 0.1, ease: 'back.out(1.2)' }
  );
};

export const animateMessage = (target) => {
  gsap.fromTo(target,
    { opacity: 0, y: 12, scale: 0.97 },
    { opacity: 1, y: 0, scale: 1, duration: 0.35, ease: 'power2.out' }
  );
};

export const activatePipelineStep = (target, color) => {
  const tl = gsap.timeline();
  tl.to(target, { scale: 1.15, duration: 0.15, ease: 'power2.out' })
    .to(target, { scale: 1.0, duration: 0.15, ease: 'bounce.out' })
    .to(target, { boxShadow: `0 0 12px ${color}55`, duration: 0.3 });
};

export const fillProgressBar = (target, percent) => {
  gsap.to(target, { width: `${percent}%`, duration: 0.8, ease: 'power1.inOut' });
};

export const pulseTypingDots = (targets) => {
  gsap.to(targets, {
    y: -6, opacity: 1, duration: 0.3, ease: 'power1.out',
    stagger: 0.15, repeat: -1, yoyo: true,
  });
};
