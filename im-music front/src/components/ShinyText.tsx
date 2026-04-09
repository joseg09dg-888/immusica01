import { motion, useMotionValue, useAnimationFrame, useTransform } from 'motion/react';

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
  const progress = useMotionValue(0);

  useAnimationFrame((time) => {
    progress.set((time * speed * 0.01) % 100);
  });

  const backgroundPosition = useTransform(
    progress,
    (p) => `${150 - p * 2}% center`
  );

  return (
    <motion.span
      className={className}
      style={{
        backgroundImage: `linear-gradient(${spread}deg, ${color} 35%, ${shineColor} 50%, ${color} 65%)`,
        backgroundSize: '200% auto',
        WebkitBackgroundClip: 'text',
        backgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundPosition,
        display: 'inline-block',
        ...style,
      }}
    >
      {text}
    </motion.span>
  );
}
