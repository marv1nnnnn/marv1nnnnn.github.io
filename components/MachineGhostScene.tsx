'use client';

import { useEffect, useRef, useState } from 'react';

export type MachineGhostMode = 'home' | 'about' | 'projects' | 'influences';

export default function MachineGhostScene({
  mode,
  progress = 0,
  mediaUrl,
  exposure = 1,
}: {
  mode: MachineGhostMode;
  progress?: number;
  mediaUrl?: string;
  exposure?: number;
}) {
  const host = useRef<HTMLDivElement>(null);
  const progressRef = useRef(progress);
  const [renderer, setRenderer] = useState<'fallback' | 'webgl'>('fallback');
  progressRef.current = progress;

  useEffect(() => {
    const container = host.current;
    if (!container || window.matchMedia('(max-width: 767px), (prefers-reduced-motion: reduce)').matches) return;

    let disposed = false;
    let frame = 0;
    let cleanup = () => {};

    import('three').then((THREE) => {
      if (disposed) return;
      try {
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(42, innerWidth / innerHeight, 0.1, 50);
        camera.position.z = 8;
        const webgl = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
        webgl.setPixelRatio(Math.min(devicePixelRatio, 1.5));
        webgl.setSize(innerWidth, innerHeight);
        webgl.domElement.setAttribute('aria-hidden', 'true');
        container.appendChild(webgl.domElement);

        const geometry = new THREE.PlaneGeometry(7.2, 7.8, 56, 56);
        const modeValue = mode === 'home' ? 0 : mode === 'about' ? 0.6 : mode === 'projects' ? 1 : 2;
        const uniforms = {
          uTime: { value: 0 },
          uProgress: { value: 0 },
          uMode: { value: modeValue },
          uImpulse: { value: 0 },
          uPointer: { value: new THREE.Vector2(0, 0) },
          uAspect: { value: innerWidth / innerHeight },
        };
        const vertexShader = `
          uniform float uTime;
          uniform float uProgress;
          uniform float uMode;
          uniform float uImpulse;
          uniform vec2 uPointer;
          varying float vDepth;
          varying vec2 vUv;
          void main() {
            vUv = uv;
            vec3 p = position;
            float pulse = sin(p.x * (2.2 + uMode * .3) + uTime * .22) * cos(p.y * 1.7 - uTime * .17);
            float scan = sin((p.x + p.y) * 4.0 + uProgress * 9.0) * .12;
            float assembled = .18 + smoothstep(0.0, .45, uProgress) * .42;
            float pointerDistance = distance(p.xy, uPointer);
            float impact = sin(pointerDistance * 8.0 - uTime * 7.0) * exp(-pointerDistance * .45) * uImpulse;
            p.z += pulse * assembled + scan + impact;
            p.x += sin(p.y * 1.3 + uTime * .1) * (.08 + uMode * .03);
            vDepth = p.z;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
          }
        `;
        const membrane = new THREE.ShaderMaterial({
          vertexShader,
          fragmentShader: `
            varying float vDepth;
            varying vec2 vUv;
            uniform float uProgress;
            uniform float uImpulse;
            void main() {
              float edge = smoothstep(0.0, .16, min(min(vUv.x, 1.0 - vUv.x), min(vUv.y, 1.0 - vUv.y)));
              float trace = smoothstep(.92, 1.0, sin((vUv.x + vUv.y) * 34.0 + uProgress * 8.0) * .5 + .5);
              vec3 bone = vec3(.86, .84, .78);
              vec3 blue = vec3(.12, .42, 1.0);
              vec3 color = mix(bone, blue, trace * .75 + max(vDepth, 0.0) * .22);
              gl_FragColor = vec4(color + vec3(.08, .2, .65) * uImpulse, (.055 + abs(vDepth) * .08 + trace * .07) * edge);
            }
          `,
          uniforms,
          transparent: true,
          side: THREE.DoubleSide,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
        });
        const trace = new THREE.ShaderMaterial({
          vertexShader,
          fragmentShader: `
            varying float vDepth;
            varying vec2 vUv;
            uniform float uImpulse;
            void main() {
              float edge = smoothstep(0.0, .14, min(min(vUv.x, 1.0 - vUv.x), min(vUv.y, 1.0 - vUv.y)));
              gl_FragColor = vec4(.42, .58 + uImpulse * .12, 1.0, (.065 + abs(vDepth) * .07 + uImpulse * .08) * edge);
            }
          `,
          uniforms,
          transparent: true,
          wireframe: true,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
        });
        const backgroundGeometry = mode === 'home' ? new THREE.PlaneGeometry(20, 12) : null;
        const backgroundMaterial = mode === 'home' ? new THREE.ShaderMaterial({
          vertexShader: `
            varying vec2 vUv;
            void main() {
              vUv = uv;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `,
          fragmentShader: `
            varying vec2 vUv;
            uniform float uTime;
            uniform float uProgress;
            uniform float uImpulse;
            uniform float uAspect;
            uniform vec2 uPointer;
            float hash(vec2 p) {
              return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
            }
            float noise(vec2 p) {
              vec2 i = floor(p);
              vec2 f = fract(p);
              vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
              return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
                         mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0)), u.x), u.y);
            }
            void main() {
              vec2 p = vUv - .5;
              p.x *= uAspect;
              p *= 2.15;
              p += uPointer * .025;
              float drift = uTime * .018 + uProgress * .35;
              vec2 q = p;
              for (float i = 1.0; i < 4.0; i++) {
                q.x -= 1.12 * noise(q * i + vec2(7.3 + drift, 2.1));
                q.y -= 1.12 * noise(q.yx * i + vec2(3.7, 9.2 - drift));
              }
              float field = noise(q * 2.0);
              float vein = pow(1.0 - smoothstep(.03, .42, abs(field - .46)), 2.2);
              float blue = pow(1.0 - smoothstep(.02, .2, abs(field - .57)), 4.0);
              float clickWave = sin(length(p - uPointer * .28) * 12.0 - uTime * 8.0) * uImpulse;
              vec3 color = vec3(.009, .012, .012);
              color += vein * vec3(.055, .062, .055);
              color += blue * vec3(.018, .055, .16) * (1.0 + uProgress * .8);
              color += max(clickWave, 0.0) * vec3(.015, .05, .18);
              float vignette = 1.0 - smoothstep(.18, .92, length((vUv - .5) * vec2(1.0, .82)));
              color *= vignette;
              gl_FragColor = vec4(color, .96);
            }
          `,
          uniforms,
          depthTest: false,
          depthWrite: false,
        }) : null;
        if (backgroundGeometry && backgroundMaterial) {
          const background = new THREE.Mesh(backgroundGeometry, backgroundMaterial);
          background.position.z = -4;
          background.renderOrder = -10;
          scene.add(background);
        }

        const layerSettings = mode === 'home' ? [
          { x: -0.7, scaleX: 0.72, scaleY: 1.02, rotX: 0.12, rotY: 0.58, rotZ: -0.12 },
          { x: 0.72, scaleX: 0.68, scaleY: 0.9, rotX: -0.08, rotY: -0.72, rotZ: 0.16 },
          { x: 0, scaleX: 0.48, scaleY: 0.78, rotX: 0.2, rotY: 1.12, rotZ: 0.56 },
        ] : [{ x: 0, scaleX: 1, scaleY: 1, rotX: 0, rotY: 0, rotZ: 0 }];
        const membraneMeshes = layerSettings.map((settings, index) => {
          const mesh = new THREE.Mesh(geometry, membrane);
          mesh.position.x = settings.x;
          mesh.scale.set(settings.scaleX, settings.scaleY, 1);
          mesh.rotation.set(settings.rotX, settings.rotY, settings.rotZ);
          mesh.userData = { ...settings, phase: index * 1.7 };
          scene.add(mesh);
          return mesh;
        });
        const traceMeshes = layerSettings.map((settings, index) => {
          const mesh = new THREE.Mesh(geometry, trace);
          mesh.position.x = settings.x;
          mesh.scale.set(settings.scaleX * 1.012, settings.scaleY * 1.012, 1.012);
          mesh.rotation.set(settings.rotX, settings.rotY, settings.rotZ);
          mesh.userData = { ...settings, phase: index * 1.7 };
          scene.add(mesh);
          return mesh;
        });

        const pointer = { x: 0, y: 0 };
        let impulse = 0;
        const onPointer = (event: PointerEvent) => {
          pointer.x = event.clientX / innerWidth - .5;
          pointer.y = event.clientY / innerHeight - .5;
        };
        const onPointerDown = (event: PointerEvent) => {
          onPointer(event);
          impulse = 1.35;
        };
        const resize = () => {
          camera.aspect = innerWidth / innerHeight;
          camera.updateProjectionMatrix();
          uniforms.uAspect.value = innerWidth / innerHeight;
          webgl.setSize(innerWidth, innerHeight);
        };
        const contextLost = (event: Event) => {
          event.preventDefault();
          setRenderer('fallback');
        };
        addEventListener('pointermove', onPointer, { passive: true });
        addEventListener('pointerdown', onPointerDown, { passive: true });
        addEventListener('resize', resize);
        webgl.domElement.addEventListener('webglcontextlost', contextLost);
        setRenderer('webgl');

        const animate = (time: number) => {
          if (disposed) return;
          uniforms.uTime.value = time / 1000;
          uniforms.uProgress.value += (progressRef.current - uniforms.uProgress.value) * .06;
          impulse *= .94;
          uniforms.uImpulse.value = impulse;
          uniforms.uPointer.value.set(pointer.x * 7, -pointer.y * 7);
          membraneMeshes.forEach((mesh, index) => {
            const base = mesh.userData;
            const drift = Math.sin(time / 2600 + base.phase) * .055;
            mesh.rotation.y += (base.rotY + pointer.x * .3 + drift + progressRef.current * (index - 1) * .18 - mesh.rotation.y) * .025;
            mesh.rotation.x += (base.rotX - pointer.y * .2 + drift - mesh.rotation.x) * .025;
            mesh.rotation.z = base.rotZ + Math.sin(time / 4100 + base.phase) * .035;
            mesh.position.y = Math.sin(time / 3300 + base.phase) * .12;
            traceMeshes[index].rotation.copy(mesh.rotation);
            traceMeshes[index].position.copy(mesh.position);
          });
          webgl.render(scene, camera);
          frame = requestAnimationFrame(animate);
        };
        frame = requestAnimationFrame(animate);

        cleanup = () => {
          cancelAnimationFrame(frame);
          removeEventListener('pointermove', onPointer);
          removeEventListener('pointerdown', onPointerDown);
          removeEventListener('resize', resize);
          webgl.domElement.removeEventListener('webglcontextlost', contextLost);
          geometry.dispose();
          membrane.dispose();
          trace.dispose();
          backgroundGeometry?.dispose();
          backgroundMaterial?.dispose();
          webgl.dispose();
          webgl.forceContextLoss();
          webgl.domElement.remove();
        };
      } catch {
        setRenderer('fallback');
      }
    }).catch(() => setRenderer('fallback'));

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      cleanup();
    };
  }, [mode]);

  const isVideo = !!mediaUrl && /\.(mov|mp4|webm)(?:$|\?)/i.test(mediaUrl);

  return (
    <div ref={host} className="machine-ghost" data-mode={mode} data-renderer={renderer} aria-hidden="true">
      <div className="machine-ghost__residue" />
      {mediaUrl && (
        <div className="machine-ghost__projection" style={{ opacity: Math.max(0, Math.min(exposure, 1)) }}>
          {isVideo
            ? <video src={mediaUrl} autoPlay muted loop playsInline preload="metadata" />
            : <img src={mediaUrl} alt="" />}
        </div>
      )}
      <div className="machine-ghost__fallback" />
    </div>
  );
}
