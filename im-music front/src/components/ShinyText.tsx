import React, { useRef, useEffect } from 'react';

interface ShinyTextProps {
  text: string;
  color?: string;
  shineColor?: string;
  speed?: number;
  spread?: number;
  className?: string;
  style?: React.CSSProperties;
}

export default function ShinyText({
  text,
  color = 'rgba(255,255,255,0.6)',
  shineColor = '#ffffff',
  speed = 2,
  spread = 120,
  className,
  style,
}: ShinyTextProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const pos = useRef(150);
  const raf = useRef<number>(0);

  useEffect(() => {
    const tick = () => {
      pos.current = (pos.current - speed * 0.4) % 300;
      if (pos.current < -50) pos.current = 250;
      if (ref.current) {
        ref.current.style.backgroundPosition = `${pos.current}% center`;
      }
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [speed]);

  return (
    <span
      ref={ref}
      className={className}
      style={{
        backgroundImage: `linear-gradient(${spread}deg, ${color} 35%, ${shineColor} 50%, ${color} 65%)`,
        backgroundSize: '200% auto',
        WebkitBackgroundClip: 'text',
        backgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundPosition: '150% center',
        display: 'inline-block',
        ...style,
      }}
    >
      {text}
    </span>
  );
}
