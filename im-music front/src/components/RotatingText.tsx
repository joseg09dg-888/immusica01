import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';

interface RotatingTextProps {
  texts: string[];
  transition?: object;
  initial?: object;
  animate?: object;
  exit?: object;
  animatePresenceMode?: string;
  animatePresenceInitial?: boolean;
  rotationInterval?: number;
  staggerDuration?: number;
  staggerFrom?: string | number;
  loop?: boolean;
  auto?: boolean;
  splitBy?: string;
  onNext?: (index: number) => void;
  mainClassName?: string;
  elementLevelClassName?: string;
  style?: React.CSSProperties;
}

export interface RotatingTextRef {
  next: () => void;
  previous: () => void;
  jumpTo: (index: number) => void;
  reset: () => void;
}

const RotatingText = forwardRef<RotatingTextRef, RotatingTextProps>((props, ref) => {
  const {
    texts,
    rotationInterval = 2200,
    loop = true,
    auto = true,
    onNext,
    mainClassName,
    style,
  } = props;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [phase, setPhase] = useState<'enter' | 'exit'>('enter');
  const phaseRef = useRef(phase);
  phaseRef.current = phase;

  const handleIndexChange = useCallback((i: number) => {
    setPhase('exit');
    setTimeout(() => {
      setCurrentIndex(i);
      setPhase('enter');
      onNext?.(i);
    }, 180);
  }, [onNext]);

  const next = useCallback(() => {
    setCurrentIndex(prev => {
      const nx = prev === texts.length - 1 ? (loop ? 0 : prev) : prev + 1;
      if (nx !== prev) {
        setPhase('exit');
        setTimeout(() => {
          setCurrentIndex(nx);
          setPhase('enter');
          onNext?.(nx);
        }, 180);
        return prev;
      }
      return prev;
    });
  }, [texts.length, loop, onNext]);

  const previous = useCallback(() => {
    setCurrentIndex(prev => {
      const pv = prev === 0 ? (loop ? texts.length - 1 : prev) : prev - 1;
      if (pv !== prev) handleIndexChange(pv);
      return prev;
    });
  }, [texts.length, loop, handleIndexChange]);

  const jumpTo = useCallback((i: number) => {
    const v = Math.max(0, Math.min(i, texts.length - 1));
    setCurrentIndex(prev => { if (v !== prev) handleIndexChange(v); return prev; });
  }, [texts.length, handleIndexChange]);

  const reset = useCallback(() => {
    setCurrentIndex(prev => { if (prev !== 0) handleIndexChange(0); return prev; });
  }, [handleIndexChange]);

  useImperativeHandle(ref, () => ({ next, previous, jumpTo, reset }), [next, previous, jumpTo, reset]);

  useEffect(() => {
    if (!auto) return;
    const id = setInterval(next, rotationInterval);
    return () => clearInterval(id);
  }, [next, rotationInterval, auto]);

  const enterStyle: React.CSSProperties = {
    display: 'inline-flex',
    overflow: 'hidden',
    position: 'relative',
    verticalAlign: 'bottom',
    ...style,
  };

  const textStyle: React.CSSProperties = {
    display: 'inline-block',
    animation: phase === 'enter'
      ? 'rotTextIn 0.18s cubic-bezier(0.22,1,0.36,1) forwards'
      : 'rotTextOut 0.15s ease-in forwards',
  };

  return (
    <>
      <style>{`
        @keyframes rotTextIn { from { opacity:0; transform:translateY(60%) } to { opacity:1; transform:translateY(0) } }
        @keyframes rotTextOut { from { opacity:1; transform:translateY(0) } to { opacity:0; transform:translateY(-60%) } }
      `}</style>
      <span className={mainClassName} style={enterStyle}>
        <span style={{ position: 'absolute', width: '1px', height: '1px', overflow: 'hidden', clip: 'rect(0,0,0,0)' }}>
          {texts[currentIndex]}
        </span>
        <span key={`${currentIndex}-${phase}`} aria-hidden="true" style={textStyle}>
          {texts[currentIndex]}
        </span>
      </span>
    </>
  );
});

RotatingText.displayName = 'RotatingText';
export default RotatingText;
