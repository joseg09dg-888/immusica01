import { useState, useEffect, useRef } from 'react';

interface MagnetProps {
  children: React.ReactNode;
  padding?: number;
  disabled?: boolean;
  magnetStrength?: number;
  activeTransition?: string;
  inactiveTransition?: string;
  style?: React.CSSProperties;
}

export default function Magnet({
  children,
  padding = 80,
  disabled = false,
  magnetStrength = 2,
  activeTransition = 'transform 0.3s ease-out',
  inactiveTransition = 'transform 0.5s ease-in-out',
  style
}: MagnetProps) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isActive, setIsActive] = useState(false);
  const magnetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (disabled) { setPosition({ x: 0, y: 0 }); return; }

    const handleMouseMove = (e: MouseEvent) => {
      if (!magnetRef.current) return;
      const { left, top, width, height } = magnetRef.current.getBoundingClientRect();
      const cx = left + width / 2, cy = top + height / 2;
      const distX = Math.abs(cx - e.clientX), distY = Math.abs(cy - e.clientY);
      if (distX < width / 2 + padding && distY < height / 2 + padding) {
        setIsActive(true);
        setPosition({ x: (e.clientX - cx) / magnetStrength, y: (e.clientY - cy) / magnetStrength });
      } else {
        setIsActive(false);
        setPosition({ x: 0, y: 0 });
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [padding, disabled, magnetStrength]);

  return (
    <div ref={magnetRef} style={{ position: 'relative', display: 'inline-block', ...style }}>
      <div style={{
        transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
        transition: isActive ? activeTransition : inactiveTransition,
        willChange: 'transform'
      }}>
        {children}
      </div>
    </div>
  );
}
