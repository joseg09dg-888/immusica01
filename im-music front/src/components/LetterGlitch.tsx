import { useRef, useEffect } from 'react';

interface LetterGlitchProps {
  glitchColors?: string[];
  glitchSpeed?: number;
  centerVignette?: boolean;
  outerVignette?: boolean;
  smooth?: boolean;
  characters?: string;
  style?: React.CSSProperties;
}

const LetterGlitch = ({
  glitchColors = ['#5E17EB', '#7B3FFF', '#C084FC'],
  glitchSpeed = 40,
  centerVignette = false,
  outerVignette = true,
  smooth = true,
  characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ!@#$&*()-_+=/[]{};:<>.,0123456789',
  style
}: LetterGlitchProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const letters = useRef<{ char: string; color: string; targetColor: string; colorProgress: number }[]>([]);
  const grid = useRef({ columns: 0, rows: 0 });
  const ctx = useRef<CanvasRenderingContext2D | null>(null);
  const lastGlitch = useRef(Date.now());
  const lettersArr = Array.from(characters);

  const fontSize = 16, charWidth = 10, charHeight = 20;

  const rChar = () => lettersArr[Math.floor(Math.random() * lettersArr.length)];
  const rColor = () => glitchColors[Math.floor(Math.random() * glitchColors.length)];

  const hexToRgb = (hex: string) => {
    hex = hex.replace(/^#?([a-f\d])([a-f\d])([a-f\d])$/i, (_, r, g, b) => r+r+g+g+b+b);
    const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return r ? { r: parseInt(r[1], 16), g: parseInt(r[2], 16), b: parseInt(r[3], 16) } : null;
  };

  const interpColor = (s: { r: number; g: number; b: number }, e: { r: number; g: number; b: number }, f: number) =>
    `rgb(${Math.round(s.r+(e.r-s.r)*f)},${Math.round(s.g+(e.g-s.g)*f)},${Math.round(s.b+(e.b-s.b)*f)})`;

  const draw = () => {
    if (!ctx.current || !letters.current.length) return;
    const c = ctx.current;
    const { width, height } = canvasRef.current!.getBoundingClientRect();
    c.clearRect(0, 0, width, height);
    c.font = `${fontSize}px monospace`;
    c.textBaseline = 'top';
    letters.current.forEach((l, i) => {
      c.fillStyle = l.color;
      c.fillText(l.char, (i % grid.current.columns) * charWidth, Math.floor(i / grid.current.columns) * charHeight);
    });
  };

  const resize = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement!;
    const dpr = window.devicePixelRatio || 1;
    const rect = parent.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
    if (ctx.current) ctx.current.setTransform(dpr, 0, 0, dpr, 0, 0);
    const cols = Math.ceil(rect.width / charWidth), rows = Math.ceil(rect.height / charHeight);
    grid.current = { columns: cols, rows };
    letters.current = Array.from({ length: cols * rows }, () => ({ char: rChar(), color: rColor(), targetColor: rColor(), colorProgress: 1 }));
    draw();
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    ctx.current = canvas.getContext('2d');
    resize();

    const animate = () => {
      const now = Date.now();
      if (now - lastGlitch.current >= glitchSpeed) {
        const count = Math.max(1, Math.floor(letters.current.length * 0.05));
        for (let i = 0; i < count; i++) {
          const idx = Math.floor(Math.random() * letters.current.length);
          letters.current[idx].char = rChar();
          letters.current[idx].targetColor = rColor();
          if (!smooth) { letters.current[idx].color = letters.current[idx].targetColor; letters.current[idx].colorProgress = 1; }
          else letters.current[idx].colorProgress = 0;
        }
        draw();
        lastGlitch.current = now;
      }
      if (smooth) {
        let dirty = false;
        letters.current.forEach(l => {
          if (l.colorProgress < 1) {
            l.colorProgress = Math.min(1, l.colorProgress + 0.05);
            const s = hexToRgb(l.color), e = hexToRgb(l.targetColor);
            if (s && e) { l.color = interpColor(s, e, l.colorProgress); dirty = true; }
          }
        });
        if (dirty) draw();
      }
      animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);

    let t: ReturnType<typeof setTimeout>;
    const onResize = () => { clearTimeout(t); t = setTimeout(() => { cancelAnimationFrame(animRef.current); resize(); animRef.current = requestAnimationFrame(animate); }, 100); };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', onResize);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [glitchSpeed, smooth]);

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', backgroundColor: 'transparent', pointerEvents: 'none', ...style }}>
      <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />
      {outerVignette && <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(circle, rgba(0,0,0,0) 40%, rgba(0,0,0,0.85) 100%)' }} />}
      {centerVignette && <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(circle, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0) 60%)' }} />}
    </div>
  );
};

export default LetterGlitch;
