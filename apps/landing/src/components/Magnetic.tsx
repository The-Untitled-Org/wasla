import React, { useRef, useEffect } from 'react';
import { gsap } from 'gsap';

interface MagneticProps {
  children: React.ReactElement;
  range?: number;
}

export default function Magnetic({ children, range = 0.4 }: MagneticProps) {
  const containerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const xTo = gsap.quickTo(el, 'x', { duration: 0.8, ease: 'power3.out' });
    const yTo = gsap.quickTo(el, 'y', { duration: 0.8, ease: 'power3.out' });

    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e;
      const { left, top, width, height } = el.getBoundingClientRect();
      const x = clientX - (left + width / 2);
      const y = clientY - (top + height / 2);

      const distance = Math.hypot(x, y);
      // Trigger magnetic effect if cursor is within a reasonable distance
      const triggerDistance = Math.max(width, height) * 0.8;

      if (distance < triggerDistance) {
        xTo(x * range);
        yTo(y * range);
      } else {
        xTo(0);
        yTo(0);
      }
    };

    const handleMouseLeave = () => {
      xTo(0);
      yTo(0);
    };

    window.addEventListener('mousemove', handleMouseMove);
    el.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      el.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [range]);

  return React.cloneElement(children, {
    ref: (node: any) => {
      containerRef.current = node;
      const { ref } = children as any;
      if (typeof ref === 'function') ref(node);
      else if (ref) ref.current = node;
    },
  } as any);
}
