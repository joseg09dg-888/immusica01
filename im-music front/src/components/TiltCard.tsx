import { useRef, useState } from 'react';

interface TiltCardProps {
  children: React.ReactNode;
  maxTilt?: number;
  scale?: number;
  glare?: boolean;
  style?: React.CSSProperties;
  className?: string;
}

export default function TiltCard({
  children,
  maxTilt = 12,
  scale = 1.03,
  glare = true,
  style,
  className,
}: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0, glareX: 50, glareY: 50 });
  const [hovered, setHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    const rx = -(y - 0.5) * maxTilt * 2;
    const ry = (x - 0.5) * maxTilt * 2;
    setTilt({ rx, ry, glareX: x * 100, glareY: y * 100 });
  };

  const handleMouseLeave = () => {
    setHovered(false);
    setTilt({ rx: 0, ry: 0, glareX: 50, glareY: 50 });
  };

  return (
    <div
      ref={ref}
      className={className}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={handleMouseLeave}
      style={{
        perspective: '800px',
        display: 'inline-block',
        width: '100%',
        ...style,
      }}
    >
      <div
        style={{
          transform: `rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg) scale(${hovered ? scale : 1})`,
          transition: hovered
            ? 'transform 0.08s ease'
            : 'transform 0.4s cubic-bezier(0.3, 0.7, 0.4, 1.5)',
          transformStyle: 'preserve-3d',
          position: 'relative',
          width: '100%',
        }}
      >
        {children}
        {glare && hovered && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: 'inherit',
              pointerEvents: 'none',
              background: `radial-gradient(circle at ${tilt.glareX}% ${tilt.glareY}%, rgba(255,255,255,0.12) 0%, transparent 60%)`,
              zIndex: 1,
            }}
          />
        )}
      </div>
    </div>
  );
}
