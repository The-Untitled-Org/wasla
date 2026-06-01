import { useEffect, useState, useRef } from 'react';

interface DecryptedTextProps {
  text: string;
  speed?: number;
  maxIterations?: number;
  sequential?: boolean;
  revealDirection?: 'start' | 'end' | 'center';
  useHover?: boolean;
  className?: string;
  animateOnMount?: boolean;
}

const chars =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+{}|:"<>?`-=[]\\;\',./';

export default function DecryptedText({
  text,
  speed = 30,
  maxIterations = 8,
  sequential = true,
  revealDirection = 'start',
  useHover = true,
  className = '',
  animateOnMount = false,
}: DecryptedTextProps) {
  const [displayText, setDisplayText] = useState(text);
  const [isAnimating, setIsAnimating] = useState(false);
  const intervalRef = useRef<any>(null);

  const startAnimation = () => {
    setIsAnimating(true);
    let iteration = 0;
    const textLength = text.length;

    if (intervalRef.current) clearInterval(intervalRef.current);

    intervalRef.current = setInterval(() => {
      setDisplayText(
        text
          .split('')
          .map((char, index) => {
            if (char === ' ') return ' ';

            let reveal = false;
            if (sequential) {
              if (revealDirection === 'start') {
                reveal = index < (iteration / maxIterations) * textLength;
              } else if (revealDirection === 'end') {
                reveal = index > textLength - (iteration / maxIterations) * textLength;
              } else {
                const mid = textLength / 2;
                const dist = Math.abs(index - mid);
                reveal = dist < (iteration / maxIterations) * mid;
              }
            } else {
              reveal = Math.random() < iteration / maxIterations;
            }

            if (reveal || iteration >= maxIterations) {
              return text[index];
            }

            return chars[Math.floor(Math.random() * chars.length)];
          })
          .join('')
      );

      if (iteration >= maxIterations) {
        clearInterval(intervalRef.current);
        setIsAnimating(false);
        setDisplayText(text);
      }
      iteration++;
    }, speed);
  };

  useEffect(() => {
    if (animateOnMount) {
      startAnimation();
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [text, animateOnMount]);

  const handleMouseEnter = () => {
    if (useHover && !isAnimating) {
      startAnimation();
    }
  };

  return (
    <span className={className} onMouseEnter={handleMouseEnter} style={{ display: 'inline-block' }}>
      {displayText}
    </span>
  );
}
