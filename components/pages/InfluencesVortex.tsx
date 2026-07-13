'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

export default function InfluencesVortex({ page }: { page: any }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredRecord, setHoveredRecord] = useState<any>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || window.matchMedia('(max-width: 767px)').matches) return;

    const isNarrow = window.innerWidth < 768;

    let disposed = false;
    let renderer: any;
    let animationId: number;
    let camera: any;
    let onWheel: (e: WheelEvent) => void;
    let onResize: () => void;
    let onMouseMove: (e: MouseEvent) => void;
    let onTouchStart: (e: TouchEvent) => void;
    let onTouchMove: (e: TouchEvent) => void;
    let lastW = typeof window !== 'undefined' ? window.innerWidth : 0;

    (async () => {
      const THREE = await import('three');
      if (disposed) return;

      const scene = new THREE.Scene();
      scene.fog = new THREE.FogExp2(0x000000, 0.05);

      camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
      camera.position.z = 0;
      camera.position.y = 0;

      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: !isNarrow, powerPreference: 'low-power' });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(isNarrow ? 1 : Math.min(window.devicePixelRatio, 2));
      container.appendChild(renderer.domElement);

      const records = page.records || [];
      const meshes: any[] = [];

      const planeSegs = isNarrow ? 8 : 32;
      const geometry = new THREE.PlaneGeometry(4, 4, planeSegs, planeSegs);
      
      const vertexShader = `
        varying vec2 vUv;
        uniform float uTime;
        uniform float uScroll;

        void main() {
          vUv = uv;
          
          vec3 pos = position;
          // Slight curve, no crazy noise
          pos.z += sin(pos.x * 1.0 + uTime * 0.5) * 0.1;
          
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `;

      const fragmentShader = `
        varying vec2 vUv;
        uniform sampler2D uTexture;
        uniform float uTime;
        uniform float uHover;
        
        void main() {
          vec2 uv = vUv;
          vec4 texColor = texture2D(uTexture, uv);
          
          // Normal color
          vec3 color = texColor.rgb;
          
          // Highlight on hover
          color += vec3(0.1) * uHover;
          
          gl_FragColor = vec4(color, texColor.a);
        }
      `;

      const textureLoader = new THREE.TextureLoader();

      records.forEach((record: any, i: number) => {
        const material = new THREE.ShaderMaterial({
          vertexShader,
          fragmentShader,
          uniforms: {
            uTime: { value: 0 },
            uScroll: { value: 0 },
            uTexture: { value: null },
            uHover: { value: 0 }
          },
          transparent: true,
          side: THREE.DoubleSide
        });

        if (record.image_url) {
          textureLoader.load(record.image_url, (texture) => {
            material.uniforms.uTexture.value = texture;
          });
        }

        const mesh = new THREE.Mesh(geometry, material);
        mesh.userData = { record, index: i };
        
        // Position in a vortex/spiral downwards
        const angle = i * Math.PI * 0.8;
        const radius = 3 + i * 0.5;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        const z = -i * 8 - 5;
        
        mesh.position.set(x, y, z);
        
        // Look at center
        mesh.lookAt(0, 0, z);
        
        scene.add(mesh);
        meshes.push(mesh);
      });

      let scrollY = 0;
      let targetScrollY = 0;
      let touchStartY = 0;

      const raycaster = new THREE.Raycaster();
      const mouse = new THREE.Vector2();
      let currentHoveredIndex: number | null = null;

      onMouseMove = (e: MouseEvent) => {
        mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
      };
      window.addEventListener('mousemove', onMouseMove);

      onWheel = (e: WheelEvent) => {
        targetScrollY += e.deltaY * 0.01;
        targetScrollY = Math.max(0, Math.min(targetScrollY, records.length * 8));
      };

      onTouchStart = (e: TouchEvent) => {
        touchStartY = e.touches[0].clientY;
        // feed touch position into raycaster so tapping highlights records
        mouse.x = (e.touches[0].clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(e.touches[0].clientY / window.innerHeight) * 2 + 1;
      };

      onTouchMove = (e: TouchEvent) => {
        const deltaY = touchStartY - e.touches[0].clientY;
        touchStartY = e.touches[0].clientY;
        targetScrollY += deltaY * 0.02;
        targetScrollY = Math.max(0, Math.min(targetScrollY, records.length * 8));
        mouse.x = (e.touches[0].clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(e.touches[0].clientY / window.innerHeight) * 2 + 1;
      };

      window.addEventListener('wheel', onWheel);
      window.addEventListener('touchstart', onTouchStart, { passive: true });
      window.addEventListener('touchmove', onTouchMove, { passive: true });

      onResize = () => {
        if (window.innerWidth === lastW) return;
        lastW = window.innerWidth;
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
      };
      window.addEventListener('resize', onResize);

      const animate = () => {
        if (disposed) return;
        animationId = requestAnimationFrame(animate);

        scrollY += (targetScrollY - scrollY) * 0.1;
        camera.position.z = -scrollY;
        
        // Rotate camera slightly as we go down
        camera.rotation.z = scrollY * 0.05;

        const time = performance.now() * 0.001;

        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(meshes);
        
        const newHoveredIndex = intersects.length > 0 ? intersects[0].object.userData.index : null;
        
        if (newHoveredIndex !== currentHoveredIndex) {
          currentHoveredIndex = newHoveredIndex;
          if (currentHoveredIndex !== null) {
            setHoveredRecord(meshes[currentHoveredIndex].userData.record);
            document.body.style.cursor = 'pointer';
          } else {
            setHoveredRecord(null);
            document.body.style.cursor = 'default';
          }
        }

        meshes.forEach((mesh, i) => {
          const mat = mesh.material as any;
          mat.uniforms.uTime.value = time;
          mat.uniforms.uScroll.value = scrollY;
          
          const targetHover = i === currentHoveredIndex ? 1.0 : 0.0;
          mat.uniforms.uHover.value += (targetHover - mat.uniforms.uHover.value) * 0.1;
        });

        renderer.render(scene, camera);
      };
      animate();

    })();

    return () => {
      disposed = true;
      cancelAnimationFrame(animationId);
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      document.body.style.cursor = 'default';
      if (renderer) {
        renderer.dispose();
        renderer.forceContextLoss?.();
        if (container.contains(renderer.domElement)) {
          container.removeChild(renderer.domElement);
        }
      }
    };
  }, [page]);

  return (
    <div className="relative min-h-[100svh] w-full overflow-hidden bg-transparent text-white">
      <div className="relative z-10 px-4 pb-[calc(2rem+env(safe-area-inset-bottom))] pt-32 md:hidden">
        <ol className="border-t border-white/20">
          {(page.records || []).map((record: any, index: number) => (
            <li key={record.id} className="grid grid-cols-[5.5rem_1fr] gap-4 border-b border-white/20 py-5">
              {record.image_url ? (
                <img
                  src={record.image_url}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="aspect-square w-full bg-white/5 object-cover"
                />
              ) : (
                <div className="aspect-square bg-white/5" aria-hidden="true" />
              )}
              <div className="min-w-0">
                <div className="mb-2 flex items-center justify-between gap-2 font-mono text-[9px] uppercase tracking-[0.18em] text-white/45">
                  <span>{String(index + 1).padStart(2, '0')} / {record.medium}</span>
                  <span>{record.year}</span>
                </div>
                <h2 className="font-serif text-xl font-bold italic leading-tight">{record.title}</h2>
                <p className="mt-1 font-sans text-xs text-white/65">{record.artist}</p>
                {record.personalNote && <p className="mt-3 font-serif text-sm italic leading-snug text-white/55">{record.personalNote}</p>}
              </div>
            </li>
          ))}
        </ol>
      </div>

      <div ref={containerRef} className="fixed inset-0 z-0 hidden pointer-events-none md:block" />

      {/* Hover info */}
      {hoveredRecord && (
        <div className="fixed bottom-12 right-12 z-20 hidden max-w-md border border-white/20 bg-black/80 p-6 pointer-events-none backdrop-blur-md md:block">
          <div className="font-mono text-[10px] sm:text-xs uppercase tracking-[0.3em] text-white/50 mb-2">
            {hoveredRecord.medium} // {hoveredRecord.year}
          </div>
          <h3 className="text-xl sm:text-2xl font-serif italic font-bold mb-1">{hoveredRecord.title}</h3>
          <div className="text-base sm:text-lg font-sans mb-3 sm:mb-4">{hoveredRecord.artist}</div>
          <p className="text-xs sm:text-sm font-mono leading-relaxed text-white/80">
            {hoveredRecord.personalNote}
          </p>
        </div>
      )}
    </div>
  );
}
