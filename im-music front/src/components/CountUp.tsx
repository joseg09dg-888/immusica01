import { useEffect, useRef, useState } from 'react';

interface CountUpProps {
  end: number;
  start?: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  style?: React.CSSProperties;
  className?: string;
}

export default function CountUp({
  end,
  start = 0,
  duration = 2000,
  prefix = '',
  suffix = '',
  decimals = 0,
  style,
  className,
}: CountUpProps) {
  const [value, setValue] = useState(start);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const startTime = performance.now();
          const range = end - start;
          const tick = (now: number) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // Cubic ease-out
            const eased = 1 - Math.pow(1 - progress, 3);
            setValue(parseFloat((start + eased * range).toFixed(decimals)));
            if (progress < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [end, start, duration, decimals]);

  return (
    <span ref={ref} style={style} className={className}>
      {prefix}{decimals > 0 ? value.toFixed(decimals) : Math.round(value)}{suffix}
    </span>
  );
}
