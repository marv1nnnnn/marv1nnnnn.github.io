'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';

export default function ProjectsRiver({ page, signalId }: { page: any, signalId: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredCard, setHoveredCard] = useState<any | null>(null);
  const router = useRouter();

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let disposed = false;
    let renderer: any;
    let animationId: number;
    let camera: any;
    let onMouseMove: (e: MouseEvent) => void;
    let onWheel: (e: WheelEvent) => void;
    let onClick: () => void;
    let onResize: () => void;

    (async () => {
      const THREE = await import('three');
      if (disposed) return;

      const scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
      camera.position.z = 20;

      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      container.appendChild(renderer.domElement);

      const cards = page.cards || [];
      const meshes: any[] = [];
      
      const geometry = new THREE.SphereGeometry(1, 64, 64);
      
      const vertexShader = `
        varying vec2 vUv;
        varying vec3 vNormal;
        uniform float uTime;
        uniform float uHover;
        uniform float uIndex;

        vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
        vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}

        float snoise(vec3 v){ 
          const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
          const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);
          vec3 i  = floor(v + dot(v, C.yyy) );
          vec3 x0 = v - i + dot(i, C.xxx) ;
          vec3 g = step(x0.yzx, x0.xyz);
          vec3 l = 1.0 - g;
          vec3 i1 = min( g.xyz, l.zxy );
          vec3 i2 = max( g.xyz, l.zxy );
          vec3 x1 = x0 - i1 + 1.0 * C.xxx;
          vec3 x2 = x0 - i2 + 2.0 * C.xxx;
          vec3 x3 = x0 - 1.0 + 3.0 * C.xxx;
          i = mod(i, 289.0 ); 
          vec4 p = permute( permute( permute( 
                     i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
                   + i.y + vec4(0.0, i1.y, i2.y, 1.0 )) 
                   + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));
          float n_ = 1.0/7.0;
          vec3  ns = n_ * D.wyz - D.xzx;
          vec4 j = p - 49.0 * floor(p * ns.z *ns.z);
          vec4 x_ = floor(j * ns.z);
          vec4 y_ = floor(j - 7.0 * x_ );
          vec4 x = x_ *ns.x + ns.yyyy;
          vec4 y = y_ *ns.x + ns.yyyy;
          vec4 h = 1.0 - abs(x) - abs(y);
          vec4 b0 = vec4( x.xy, y.xy );
          vec4 b1 = vec4( x.zw, y.zw );
          vec4 s0 = floor(b0)*2.0 + 1.0;
          vec4 s1 = floor(b1)*2.0 + 1.0;
          vec4 sh = -step(h, vec4(0.0));
          vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
          vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;
          vec3 p0 = vec3(a0.xy,h.x);
          vec3 p1 = vec3(a0.zw,h.y);
          vec3 p2 = vec3(a1.xy,h.z);
          vec3 p3 = vec3(a1.zw,h.w);
          vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
          p0 *= norm.x;
          p1 *= norm.y;
          p2 *= norm.z;
          p3 *= norm.w;
          vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
          m = m * m;
          return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), 
                                        dot(p2,x2), dot(p3,x3) ) );
        }

        void main() {
          vUv = uv;
          vNormal = normal;
          
          float noise = snoise(vec3(position.x * 2.0 + uTime * 0.5, position.y * 2.0, position.z * 2.0 + uIndex * 10.0));
          vec3 newPosition = position + normal * noise * (0.2 + uHover * 0.5);
          
          // Flatten when hovered to act like an ink drop
          newPosition.z *= (1.0 - uHover * 0.8);
          newPosition.x *= (1.0 + uHover * 2.0);
          newPosition.y *= (1.0 + uHover * 2.0);
          
          gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
        }
      `;

      const fragmentShader = `
        varying vec2 vUv;
        varying vec3 vNormal;
        uniform float uTime;
        uniform float uHover;
        
        void main() {
          vec3 normal = normalize(vNormal);
          
          vec3 baseColor = vec3(0.1, 0.1, 0.1);
          vec3 inkColor = vec3(0.8, 0.9, 1.0);
          
          float fresnel = dot(vec3(0.0, 0.0, 1.0), normal);
          fresnel = clamp(1.0 - fresnel, 0.0, 1.0);
          fresnel = pow(fresnel, 3.0);
          
          vec3 color = mix(baseColor, inkColor, fresnel * (1.0 - uHover) + uHover);
          
          gl_FragColor = vec4(color, 0.6 + uHover * 0.4);
        }
      `;

      cards.forEach((card: any, i: number) => {
        const material = new THREE.ShaderMaterial({
          vertexShader,
          fragmentShader,
          uniforms: {
            uTime: { value: 0 },
            uHover: { value: 0 },
            uIndex: { value: i }
          },
          transparent: true,
          side: THREE.DoubleSide
        });

        const mesh = new THREE.Mesh(geometry, material);
        
        // Distribute in a river-like flow
        const t = i / Math.max(1, cards.length - 1);
        const y = (0.5 - t) * 20;
        const x = Math.sin(t * Math.PI * 4) * 4;
        const z = Math.cos(t * Math.PI * 3) * 2;
        
        mesh.position.set(x, y, z);
        mesh.userData = { card, index: i, baseX: x, baseY: y, baseZ: z };
        
        scene.add(mesh);
        meshes.push(mesh);
      });

      const raycaster = new THREE.Raycaster();
      const mouse = new THREE.Vector2();
      let scrollY = 0;
      let targetScrollY = 0;

      onMouseMove = (e: MouseEvent) => {
        mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
      };
      
      onWheel = (e: WheelEvent) => {
        targetScrollY += e.deltaY * 0.02;
        // Limit scroll
        targetScrollY = Math.max(-5, Math.min(targetScrollY, 20));
      };

      onClick = () => {
        const intersects = raycaster.intersectObjects(meshes);
        if (intersects.length > 0) {
          const card = intersects[0].object.userData.card;
          router.push(`/signals/${signalId}/${card.id}`);
        }
      };

      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('wheel', onWheel);
      window.addEventListener('click', onClick);

      onResize = () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
      };
      window.addEventListener('resize', onResize);

      const animate = () => {
        if (disposed) return;
        animationId = requestAnimationFrame(animate);

        scrollY += (targetScrollY - scrollY) * 0.1;
        scene.position.y = scrollY;

        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(meshes);
        const hoveredMesh = intersects.length > 0 ? intersects[0].object : null;

        if (hoveredMesh) {
          document.body.style.cursor = 'pointer';
          setHoveredCard(hoveredMesh.userData.card);
        } else {
          document.body.style.cursor = '';
          setHoveredCard(null);
        }

        const time = performance.now() * 0.001;

        meshes.forEach((mesh) => {
          const isHovered = mesh === hoveredMesh;
          const mat = mesh.material as any;
          
          mat.uniforms.uTime.value = time;
          mat.uniforms.uHover.value += ((isHovered ? 1.0 : 0.0) - mat.uniforms.uHover.value) * 0.1;

          // Gentle floating
          mesh.position.y = mesh.userData.baseY + Math.sin(time + mesh.userData.index) * 0.5;
          mesh.position.x = mesh.userData.baseX + Math.cos(time * 0.8 + mesh.userData.index) * 0.3;
          
          mesh.rotation.y += 0.005;
          mesh.rotation.x += 0.003;
        });

        renderer.render(scene, camera);
      };
      animate();

    })();

    return () => {
      disposed = true;
      cancelAnimationFrame(animationId);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('click', onClick);
      window.removeEventListener('resize', onResize);
      document.body.style.cursor = '';
      if (renderer) {
        renderer.dispose();
        if (container.contains(renderer.domElement)) {
          container.removeChild(renderer.domElement);
        }
      }
    };
  }, [page, signalId, router]);

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-black text-white">
      <div ref={containerRef} className="fixed inset-0 z-0" />
      
      <AnimatePresence>
        {hoveredCard && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none mix-blend-difference w-full max-w-2xl text-center"
          >
            <h2 className="text-5xl md:text-7xl font-serif font-black italic tracking-tighter uppercase mb-4">
              {hoveredCard.title}
            </h2>
            <p className="font-mono text-sm uppercase tracking-[0.3em] text-white/60 mb-6">
              {hoveredCard.date?.replace(/-/g, '.')} // {hoveredCard.tags?.join(', ')}
            </p>
            <p className="font-serif text-xl italic text-white/80">
              {hoveredCard.summary}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
      
      <div className="fixed bottom-12 right-12 z-10 mix-blend-difference pointer-events-none">
        <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/50 flex flex-col items-end gap-2">
          <span>Scroll to navigate river</span>
          <span>Click pebble to inspect</span>
        </div>
      </div>
    </div>
  );
}
