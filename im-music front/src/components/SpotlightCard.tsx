import { useRef } from 'react';

interface SpotlightCardProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
  spotlightColor?: string;
}

export default function SpotlightCard({
  children,
  style,
  spotlightColor = 'rgba(94,23,235,0.25)'
}: SpotlightCardProps) {
  const divRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!divRef.current) return;
    const rect = divRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    divRef.current.style.setProperty('--mouse-x', `${x}px`);
    divRef.current.style.setProperty('--mouse-y', `${y}px`);
    divRef.current.style.setProperty('--spotlight-color', spotlightColor);
  };

  return (
    <div
      ref={divRef}
      onMouseMove={handleMouseMove}
      className="spotlight-card"
      style={style}
    >
      {children}
    </div>
  );
}
