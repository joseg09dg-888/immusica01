import { useEffect, useRef, useState } from 'react';
import { useSpring, animated, config } from '@react-spring/web';

interface SplitTextProps {
  text: string;
  style?: React.CSSProperties;
  delay?: number;
  charDelay?: number;
  className?: string;
  tag?: keyof React.JSX.IntrinsicElements;
}

function AnimChar({ char, delay, started }: { char: string; delay: number; started: boolean }) {
  const spring = useSpring({
    from: { opacity: 0, y: 40 },
    to: started ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 },
    delay,
    config: { tension: 200, friction: 20 }
  });
  return (
    <animated.span style={{ display: 'inline-block', whiteSpace: char === ' ' ? 'pre' : 'normal', ...spring }}>
      {char === ' ' ? '\u00A0' : char}
    </animated.span>
  );
}

export default function SplitText({
  text,
  style,
  delay = 0,
  charDelay = 35,
  className
}: SplitTextProps) {
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setStarted(true); observer.disconnect(); } },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const chars = text.split('');

  return (
    <div ref={ref} className={className} style={{ display: 'inline', ...style }}>
      {chars.map((char, i) => (
        <AnimChar key={i} char={char} delay={delay + i * charDelay} started={started} />
      ))}
    </div>
  );
}
