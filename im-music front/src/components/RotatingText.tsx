import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface RotatingTextProps {
  texts: string[];
  transition?: object;
  initial?: object;
  animate?: object;
  exit?: object;
  animatePresenceMode?: 'wait' | 'sync' | 'popLayout';
  animatePresenceInitial?: boolean;
  rotationInterval?: number;
  staggerDuration?: number;
  staggerFrom?: 'first' | 'last' | 'center' | 'random' | number;
  loop?: boolean;
  auto?: boolean;
  splitBy?: 'characters' | 'words' | 'lines' | string;
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
    transition = { type: 'spring', damping: 25, stiffness: 300 },
    initial = { y: '100%', opacity: 0 },
    animate: animateProp = { y: 0, opacity: 1 },
    exit = { y: '-120%', opacity: 0 },
    animatePresenceMode = 'wait',
    animatePresenceInitial = false,
    rotationInterval = 2200,
    staggerDuration = 0,
    staggerFrom = 'first',
    loop = true,
    auto = true,
    splitBy = 'characters',
    onNext,
    mainClassName,
    elementLevelClassName,
    style
  } = props;

  const [currentTextIndex, setCurrentTextIndex] = useState(0);

  const splitIntoChars = (text: string) => {
    if (typeof Intl !== 'undefined' && Intl.Segmenter) {
      const seg = new Intl.Segmenter('en', { granularity: 'grapheme' });
      return Array.from(seg.segment(text), s => s.segment);
    }
    return Array.from(text);
  };

  const elements = useMemo(() => {
    const cur = texts[currentTextIndex];
    if (splitBy === 'characters') {
      return cur.split(' ').map((word, i, arr) => ({ characters: splitIntoChars(word), needsSpace: i !== arr.length - 1 }));
    }
    if (splitBy === 'words') {
      return cur.split(' ').map((word, i, arr) => ({ characters: [word], needsSpace: i !== arr.length - 1 }));
    }
    return cur.split(splitBy).map((part, i, arr) => ({ characters: [part], needsSpace: i !== arr.length - 1 }));
  }, [texts, currentTextIndex, splitBy]);

  const getStaggerDelay = useCallback((index: number, total: number) => {
    if (staggerFrom === 'first') return index * staggerDuration;
    if (staggerFrom === 'last') return (total - 1 - index) * staggerDuration;
    if (staggerFrom === 'center') return Math.abs(Math.floor(total / 2) - index) * staggerDuration;
    if (staggerFrom === 'random') return Math.abs(Math.floor(Math.random() * total) - index) * staggerDuration;
    return Math.abs((staggerFrom as number) - index) * staggerDuration;
  }, [staggerFrom, staggerDuration]);

  const handleIndexChange = useCallback((i: number) => {
    setCurrentTextIndex(i);
    onNext?.(i);
  }, [onNext]);

  const next = useCallback(() => {
    const nx = currentTextIndex === texts.length - 1 ? (loop ? 0 : currentTextIndex) : currentTextIndex + 1;
    if (nx !== currentTextIndex) handleIndexChange(nx);
  }, [currentTextIndex, texts.length, loop, handleIndexChange]);

  const previous = useCallback(() => {
    const pv = currentTextIndex === 0 ? (loop ? texts.length - 1 : currentTextIndex) : currentTextIndex - 1;
    if (pv !== currentTextIndex) handleIndexChange(pv);
  }, [currentTextIndex, texts.length, loop, handleIndexChange]);

  const jumpTo = useCallback((i: number) => {
    const v = Math.max(0, Math.min(i, texts.length - 1));
    if (v !== currentTextIndex) handleIndexChange(v);
  }, [texts.length, currentTextIndex, handleIndexChange]);

  const reset = useCallback(() => { if (currentTextIndex !== 0) handleIndexChange(0); }, [currentTextIndex, handleIndexChange]);

  useImperativeHandle(ref, () => ({ next, previous, jumpTo, reset }), [next, previous, jumpTo, reset]);

  useEffect(() => {
    if (!auto) return;
    const id = setInterval(next, rotationInterval);
    return () => clearInterval(id);
  }, [next, rotationInterval, auto]);

  const totalChars = elements.reduce((sum, w) => sum + w.characters.length, 0);

  return (
    <motion.span
      className={mainClassName}
      layout
      transition={transition as any}
      style={{ display: 'inline-flex', overflow: 'hidden', position: 'relative', verticalAlign: 'bottom', ...style }}
    >
      <span style={{ position: 'absolute', width: '1px', height: '1px', overflow: 'hidden', clip: 'rect(0,0,0,0)' }}>
        {texts[currentTextIndex]}
      </span>
      <AnimatePresence mode={animatePresenceMode} initial={animatePresenceInitial}>
        <motion.span key={currentTextIndex} layout aria-hidden="true" style={{ display: 'inline-flex', flexWrap: 'wrap' }}>
          {elements.map((wordObj, wordIndex, array) => {
            const prevChars = array.slice(0, wordIndex).reduce((sum, w) => sum + w.characters.length, 0);
            return (
              <span key={wordIndex} style={{ display: 'inline-flex' }}>
                {wordObj.characters.map((char, charIndex) => (
                  <motion.span
                    key={charIndex}
                    initial={initial as any}
                    animate={animateProp as any}
                    exit={exit as any}
                    transition={{ ...transition as any, delay: getStaggerDelay(prevChars + charIndex, totalChars) }}
                    className={elementLevelClassName}
                    style={{ display: 'inline-block' }}
                  >
                    {char}
                  </motion.span>
                ))}
                {wordObj.needsSpace && <span style={{ display: 'inline-block' }}>&nbsp;</span>}
              </span>
            );
          })}
        </motion.span>
      </AnimatePresence>
    </motion.span>
  );
});

RotatingText.displayName = 'RotatingText';
export default RotatingText;
