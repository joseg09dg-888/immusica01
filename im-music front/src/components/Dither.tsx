/**
 * Dither — single-pass WebGL shader (wave + Bayer matrix dither, no EffectComposer)
 * Works in Playwright headless and all browsers.
 */
import { useEffect, useRef } from 'react';

const VERT = `
precision highp float;
attribute vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const FRAG = `
precision highp float;
uniform vec2 uResolution;
uniform float uTime;
uniform float uWaveSpeed;
uniform float uWaveFrequency;
uniform float uWaveAmplitude;
uniform vec3 uWaveColor;
uniform float uColorNum;
uniform float uPixelSize;
uniform vec2 uMousePos;
uniform int uEnableMouse;
uniform float uMouseRadius;

// Classic Perlin noise
vec4 permute4(vec4 x){return mod(((x*34.0)+1.0)*x,289.0);}
vec2 fade2(vec2 t){return t*t*t*(t*(t*6.0-15.0)+10.0);}
float cnoise(vec2 P){
  vec4 Pi=floor(P.xyxy)+vec4(0.0,0.0,1.0,1.0);
  vec4 Pf=fract(P.xyxy)-vec4(0.0,0.0,1.0,1.0);
  Pi=mod(Pi,289.0);
  vec4 ix=Pi.xzxz,iy=Pi.yyww,fx=Pf.xzxz,fy=Pf.yyww;
  vec4 i=permute4(permute4(ix)+iy);
  vec4 gx=2.0*fract(i*(1.0/41.0))-1.0;
  vec4 gy=abs(gx)-0.5;
  vec4 tx=floor(gx+0.5);gx=gx-tx;
  vec2 g00=vec2(gx.x,gy.x),g10=vec2(gx.y,gy.y),g01=vec2(gx.z,gy.z),g11=vec2(gx.w,gy.w);
  vec4 norm=1.79284291-0.85373472*vec4(dot(g00,g00),dot(g01,g01),dot(g10,g10),dot(g11,g11));
  g00*=norm.x;g01*=norm.y;g10*=norm.z;g11*=norm.w;
  float n00=dot(g00,vec2(fx.x,fy.x)),n10=dot(g10,vec2(fx.y,fy.y)),n01=dot(g01,vec2(fx.z,fy.z)),n11=dot(g11,vec2(fx.w,fy.w));
  vec2 fade_xy=fade2(Pf.xy);
  vec2 nx=mix(vec2(n00,n01),vec2(n10,n11),fade_xy.x);
  return 2.3*mix(nx.x,nx.y,fade_xy.y);
}

float fbm(vec2 p){
  float v=0.0,a=1.0,f=uWaveFrequency;
  for(int i=0;i<4;i++){v+=a*abs(cnoise(p));p*=f;a*=uWaveAmplitude;}
  return v;
}

float pattern(vec2 p){
  vec2 p2=p-uTime*uWaveSpeed;
  return fbm(p+fbm(p2));
}

// Bayer 8x8 ordered dither
float bayer(vec2 coord){
  int x=int(mod(coord.x,8.0)),y=int(mod(coord.y,8.0));
  float m[64];
  m[0]=0.0;  m[1]=32.0; m[2]=8.0;  m[3]=40.0; m[4]=2.0;  m[5]=34.0; m[6]=10.0; m[7]=42.0;
  m[8]=48.0; m[9]=16.0; m[10]=56.0;m[11]=24.0;m[12]=50.0;m[13]=18.0;m[14]=58.0;m[15]=26.0;
  m[16]=12.0;m[17]=44.0;m[18]=4.0; m[19]=36.0;m[20]=14.0;m[21]=46.0;m[22]=6.0; m[23]=38.0;
  m[24]=60.0;m[25]=28.0;m[26]=52.0;m[27]=20.0;m[28]=62.0;m[29]=30.0;m[30]=54.0;m[31]=22.0;
  m[32]=3.0; m[33]=35.0;m[34]=11.0;m[35]=43.0;m[36]=1.0; m[37]=33.0;m[38]=9.0; m[39]=41.0;
  m[40]=51.0;m[41]=19.0;m[42]=59.0;m[43]=27.0;m[44]=49.0;m[45]=17.0;m[46]=57.0;m[47]=25.0;
  m[48]=15.0;m[49]=47.0;m[50]=7.0; m[51]=39.0;m[52]=13.0;m[53]=45.0;m[54]=5.0; m[55]=37.0;
  m[56]=63.0;m[57]=31.0;m[58]=55.0;m[59]=23.0;m[60]=61.0;m[61]=29.0;m[62]=53.0;m[63]=21.0;
  return m[y*8+x]/64.0;
}

vec3 ditherColor(vec2 fragCoord, vec3 color){
  vec2 pixCoord=floor(fragCoord/uPixelSize);
  float threshold=bayer(mod(pixCoord,8.0))-0.25;
  float step=1.0/(uColorNum-1.0);
  vec3 c=clamp(color+threshold*step-0.1,0.0,1.0);
  return floor(c*(uColorNum-1.0)+0.5)/(uColorNum-1.0);
}

void main(){
  // Pixelate: snap UV to pixel grid
  vec2 pixelUV=floor(gl_FragCoord.xy/uPixelSize)*uPixelSize;
  vec2 uv=pixelUV/uResolution;
  uv-=0.5;
  uv.x*=uResolution.x/uResolution.y;

  float f=pattern(uv);

  if(uEnableMouse==1){
    vec2 m=(uMousePos/uResolution-0.5)*vec2(1.0,-1.0);
    m.x*=uResolution.x/uResolution.y;
    float d=length(uv-m);
    float effect=1.0-smoothstep(0.0,uMouseRadius,d);
    f-=0.5*effect;
  }

  vec3 col=mix(vec3(0.0),uWaveColor,clamp(f,0.0,1.0));
  col=ditherColor(gl_FragCoord.xy,col);

  gl_FragColor=vec4(col,1.0);
}
`;

export interface DitherProps {
  waveSpeed?: number;
  waveFrequency?: number;
  waveAmplitude?: number;
  waveColor?: [number, number, number];
  colorNum?: number;
  pixelSize?: number;
  disableAnimation?: boolean;
  enableMouseInteraction?: boolean;
  mouseRadius?: number;
  style?: React.CSSProperties;
}

export default function Dither({
  waveSpeed = 0.05,
  waveFrequency = 3,
  waveAmplitude = 0.3,
  waveColor = [0.37, 0.09, 0.92],
  colorNum = 4,
  pixelSize = 2,
  disableAnimation = false,
  enableMouseInteraction = true,
  mouseRadius = 0.3,
  style
}: DitherProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;';
    container.appendChild(canvas);

    const gl = canvas.getContext('webgl', { antialias: false, alpha: false, preserveDrawingBuffer: true });
    if (!gl) return;

    // Compile shaders
    const compile = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    };
    const prog = gl.createProgram()!;
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    gl.useProgram(prog);

    // Full-screen quad
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
    const pos = gl.getAttribLocation(prog, 'position');
    gl.enableVertexAttribArray(pos);
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);

    // Uniform locations
    const uRes = gl.getUniformLocation(prog, 'uResolution');
    const uTime = gl.getUniformLocation(prog, 'uTime');
    const uWaveSpeed = gl.getUniformLocation(prog, 'uWaveSpeed');
    const uWaveFreq = gl.getUniformLocation(prog, 'uWaveFrequency');
    const uWaveAmp = gl.getUniformLocation(prog, 'uWaveAmplitude');
    const uWaveColor = gl.getUniformLocation(prog, 'uWaveColor');
    const uColorNum = gl.getUniformLocation(prog, 'uColorNum');
    const uPixelSize = gl.getUniformLocation(prog, 'uPixelSize');
    const uMousePos = gl.getUniformLocation(prog, 'uMousePos');
    const uEnableMouse = gl.getUniformLocation(prog, 'uEnableMouse');
    const uMouseRadius = gl.getUniformLocation(prog, 'uMouseRadius');

    const resize = () => {
      const w = container.clientWidth, h = container.clientHeight;
      canvas.width = w; canvas.height = h;
      gl.viewport(0, 0, w, h);
    };
    window.addEventListener('resize', resize);
    resize();

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };
    if (enableMouseInteraction) window.addEventListener('mousemove', handleMouseMove);

    let id: number;
    const startTime = performance.now();

    const render = () => {
      id = requestAnimationFrame(render);
      const elapsed = disableAnimation ? 0 : (performance.now() - startTime) / 1000;
      const w = canvas.width, h = canvas.height;

      gl.uniform2f(uRes, w, h);
      gl.uniform1f(uTime, elapsed);
      gl.uniform1f(uWaveSpeed, waveSpeed);
      gl.uniform1f(uWaveFreq, waveFrequency);
      gl.uniform1f(uWaveAmp, waveAmplitude);
      gl.uniform3f(uWaveColor, waveColor[0], waveColor[1], waveColor[2]);
      gl.uniform1f(uColorNum, colorNum);
      gl.uniform1f(uPixelSize, pixelSize);
      gl.uniform2f(uMousePos, mouseRef.current.x, mouseRef.current.y);
      gl.uniform1i(uEnableMouse, enableMouseInteraction ? 1 : 0);
      gl.uniform1f(uMouseRadius, mouseRadius);

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };
    id = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(id);
      window.removeEventListener('resize', resize);
      if (enableMouseInteraction) window.removeEventListener('mousemove', handleMouseMove);
      if (container.contains(canvas)) container.removeChild(canvas);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={containerRef}
      style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', ...style }}
    />
  );
}
