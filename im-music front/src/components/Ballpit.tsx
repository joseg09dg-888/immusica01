import { useEffect, useRef } from 'react';
import {
  WebGLRenderer, PerspectiveCamera, Scene, InstancedMesh, SphereGeometry,
  MeshPhysicalMaterial, Object3D, Color, PointLight, AmbientLight,
  ACESFilmicToneMapping, SRGBColorSpace, Vector3, Vector2, MathUtils, Raycaster, Plane,
  PMREMGenerator
} from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

interface BallpitProps {
  colors?: string[];
  count?: number;
  gravity?: number;
  followCursor?: boolean;
  style?: React.CSSProperties;
}

// Simple physics
class Physics {
  pos: Float32Array;
  vel: Float32Array;
  sizes: Float32Array;
  center = new Vector3();
  cfg: any;

  constructor(cfg: any) {
    this.cfg = cfg;
    this.pos = new Float32Array(cfg.count * 3);
    this.vel = new Float32Array(cfg.count * 3);
    this.sizes = new Float32Array(cfg.count);
    this.sizes[0] = cfg.size0 ?? 1.2;
    for (let i = 1; i < cfg.count; i++) {
      this.pos[i*3]   = MathUtils.randFloatSpread(2 * cfg.maxX);
      this.pos[i*3+1] = MathUtils.randFloatSpread(2 * cfg.maxY);
      this.pos[i*3+2] = MathUtils.randFloatSpread(2 * cfg.maxZ);
      this.sizes[i] = MathUtils.randFloat(cfg.minSize, cfg.maxSize);
    }
  }

  step(delta: number) {
    const { cfg, pos, vel, sizes, center } = this;
    const P = new Vector3(), V = new Vector3(), O = new Vector3(), N = new Vector3(), D = new Vector3(), J = new Vector3();
    const start = cfg.controlSphere0 ? 1 : 0;

    if (cfg.controlSphere0) {
      P.fromArray(pos, 0);
      P.lerp(center, 0.12).toArray(pos, 0);
      V.set(0,0,0).toArray(vel, 0);
    }

    for (let i = start; i < cfg.count; i++) {
      const b = i*3;
      P.fromArray(pos, b); V.fromArray(vel, b);
      V.y -= delta * cfg.gravity * sizes[i];
      V.multiplyScalar(cfg.friction);
      V.clampLength(0, cfg.maxVelocity);
      P.add(V); P.toArray(pos, b); V.toArray(vel, b);
    }

    for (let i = start; i < cfg.count; i++) {
      const b = i*3; P.fromArray(pos, b); V.fromArray(vel, b); const R = sizes[i];
      for (let j = i+1; j < cfg.count; j++) {
        const ob = j*3; O.fromArray(pos, ob); N.fromArray(vel, ob); const oR = sizes[j];
        D.copy(O).sub(P);
        const dist = D.length(), sumR = R + oR;
        if (dist < sumR && dist > 0.001) {
          const ov = (sumR - dist) * 0.5;
          J.copy(D).normalize().multiplyScalar(ov);
          P.sub(J); V.sub(J.clone().multiplyScalar(Math.max(V.length(), 1)));
          P.toArray(pos, b); V.toArray(vel, b);
          O.add(J); N.add(J.clone().multiplyScalar(Math.max(N.length(), 1)));
          O.toArray(pos, ob); N.toArray(vel, ob);
        }
      }
      if (Math.abs(P.x) + R > cfg.maxX) { P.x = Math.sign(P.x)*(cfg.maxX-R); V.x *= -cfg.wallBounce; }
      if (cfg.gravity === 0) { if (Math.abs(P.y) + R > cfg.maxY) { P.y = Math.sign(P.y)*(cfg.maxY-R); V.y *= -cfg.wallBounce; } }
      else if (P.y - R < -cfg.maxY) { P.y = -cfg.maxY+R; V.y *= -cfg.wallBounce; }
      if (Math.abs(P.z) + R > cfg.maxZ) { P.z = Math.sign(P.z)*(cfg.maxZ-R); V.z *= -cfg.wallBounce; }
      P.toArray(pos, b); V.toArray(vel, b);
    }
  }
}

export default function Ballpit({
  colors = ['#5E17EB', '#7B3FFF', '#9B59B6', '#C084FC', '#3a0ca3', '#ffffff'],
  count = 80,
  gravity = 0.4,
  followCursor = true,
  style
}: BallpitProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Renderer
    const renderer = new WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    renderer.toneMapping = ACESFilmicToneMapping;
    renderer.outputColorSpace = SRGBColorSpace;
    container.appendChild(renderer.domElement);
    renderer.domElement.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;';

    // Scene + camera
    const scene = new Scene();
    const camera = new PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(0, 0, 20);

    // Environment
    const envGen = new PMREMGenerator(renderer);
    const envTex = envGen.fromScene(new RoomEnvironment(), 0.04).texture;
    envGen.dispose();

    // Material
    const mat = new MeshPhysicalMaterial({
      envMap: envTex,
      metalness: 0.3,
      roughness: 0.35,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
      vertexColors: true
    });
    (mat as any).envMapRotation.x = -Math.PI / 2;

    // Balls
    const geo = new SphereGeometry(1, 24, 24);
    const mesh = new InstancedMesh(geo, mat, count);
    const palette = colors.map(c => new Color(c));
    for (let i = 0; i < count; i++) {
      const ratio = i / count;
      const scaled = ratio * (palette.length - 1);
      const idx = Math.floor(scaled), alpha = scaled - idx;
      const col = new Color();
      const s = palette[idx], e2 = palette[Math.min(idx+1, palette.length-1)];
      col.r = s.r + alpha*(e2.r-s.r); col.g = s.g + alpha*(e2.g-s.g); col.b = s.b + alpha*(e2.b-s.b);
      mesh.setColorAt(i, col);
    }
    mesh.instanceColor!.needsUpdate = true;
    scene.add(mesh);

    // Lights
    const ambient = new AmbientLight(0xffffff, 1.0);
    scene.add(ambient);
    const light = new PointLight(colors[0], 200);
    scene.add(light);

    // Physics
    const cfg = { count, gravity, friction: 0.997, wallBounce: 0.95, maxVelocity: 0.15, maxX: 5, maxY: 5, maxZ: 2, minSize: 0.45, maxSize: 1.0, size0: 1.2, controlSphere0: false };
    const physics = new Physics(cfg);

    // Resize
    const resize = () => {
      const w = container.clientWidth, h = container.clientHeight;
      renderer.setSize(w, h);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      camera.aspect = w / h;
      camera.fov = 45;
      if (camera.aspect > 1.5) { camera.fov = 2 * MathUtils.radToDeg(Math.atan(Math.tan(MathUtils.degToRad(45/2)) * (camera.aspect / 1.5))); }
      camera.updateProjectionMatrix();
      const fovR = camera.fov * Math.PI / 180;
      const wH = 2 * Math.tan(fovR/2) * camera.position.z;
      cfg.maxX = (wH * camera.aspect) / 2;
      cfg.maxY = wH / 2;
    };
    window.addEventListener('resize', resize);
    resize();

    // Mouse tracking
    const mouse = new Vector2();
    const raycaster = new Raycaster();
    const plane = new Plane(new Vector3(0, 0, 1), 0);
    const hitPoint = new Vector3();
    const onMove = (e: MouseEvent) => {
      if (!followCursor) return;
      const rect = container.getBoundingClientRect();
      mouse.set(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
      raycaster.setFromCamera(mouse, camera);
      camera.getWorldDirection(plane.normal);
      raycaster.ray.intersectPlane(plane, hitPoint);
      physics.center.copy(hitPoint);
      cfg.controlSphere0 = true;
    };
    const onLeave = () => { cfg.controlSphere0 = false; };
    container.addEventListener('mousemove', onMove);
    container.addEventListener('mouseleave', onLeave);

    // Animation
    const dummy = new Object3D();
    let lastTime = performance.now();
    let rafId = 0;

    const animate = () => {
      rafId = requestAnimationFrame(animate);
      const now = performance.now();
      const delta = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;
      physics.step(delta);
      for (let i = 0; i < count; i++) {
        dummy.position.fromArray(physics.pos, i*3);
        dummy.scale.setScalar(i === 0 && !followCursor ? 0 : physics.sizes[i]);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
        if (i === 0) light.position.copy(dummy.position);
      }
      mesh.instanceMatrix.needsUpdate = true;
      renderer.render(scene, camera);
    };
    rafId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
      container.removeEventListener('mousemove', onMove);
      container.removeEventListener('mouseleave', onLeave);
      geo.dispose(); mat.dispose(); renderer.dispose();
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div ref={containerRef} style={{ position: 'absolute', inset: 0, overflow: 'hidden', ...style }} />
  );
}
