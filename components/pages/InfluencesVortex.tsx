'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

export default function InfluencesVortex({ page }: { page: any }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredRecord, setHoveredRecord] = useState<any>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let disposed = false;
    let renderer: any;
    let animationId: number;
    let camera: any;
    let onWheel: (e: WheelEvent) => void;
    let onResize: () => void;
    let onMouseMove: (e: MouseEvent) => void;
    let onTouchStart: (e: TouchEvent) => void;
    let onTouchMove: (e: TouchEvent) => void;

    (async () => {
      const THREE = await import('three');
      if (disposed) return;

      const scene = new THREE.Scene();
      scene.fog = new THREE.FogExp2(0x000000, 0.05);

      camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
      camera.position.z = 0;
      camera.position.y = 0;

      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      container.appendChild(renderer.domElement);

      const records = page.records || [];
      const meshes: any[] = [];
      
      const geometry = new THREE.PlaneGeometry(4, 4, 32, 32);
      
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
      };

      onTouchMove = (e: TouchEvent) => {
        const deltaY = touchStartY - e.touches[0].clientY;
        touchStartY = e.touches[0].clientY;
        targetScrollY += deltaY * 0.02;
        targetScrollY = Math.max(0, Math.min(targetScrollY, records.length * 8));
      };

      window.addEventListener('wheel', onWheel);
      container.addEventListener('touchstart', onTouchStart, { passive: true });
      container.addEventListener('touchmove', onTouchMove, { passive: true });

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
      container.removeEventListener('touchstart', onTouchStart);
      container.removeEventListener('touchmove', onTouchMove);
      document.body.style.cursor = 'default';
      if (renderer) {
        renderer.dispose();
        if (container.contains(renderer.domElement)) {
          container.removeChild(renderer.domElement);
        }
      }
    };
  }, [page]);

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-transparent text-white">
      <div ref={containerRef} className="fixed inset-0 z-0 md:pointer-events-none" />

      {/* Desktop hover info */}
      {hoveredRecord && (
        <div className="hidden md:block fixed bottom-12 right-12 z-20 max-w-md bg-black/80 backdrop-blur-md border border-white/20 p-6 pointer-events-none">
          <div className="font-mono text-xs uppercase tracking-[0.3em] text-white/50 mb-2">
            {hoveredRecord.medium} // {hoveredRecord.year}
          </div>
          <h3 className="text-2xl font-serif italic font-bold mb-1">{hoveredRecord.title}</h3>
          <div className="text-lg font-sans mb-4">{hoveredRecord.artist}</div>
          <p className="text-sm font-mono leading-relaxed text-white/80">
            {hoveredRecord.personalNote}
          </p>
        </div>
      )}

      {/* Mobile card list fallback */}
      <div className="md:hidden relative z-20 pt-[50vh] pb-12 px-4">
        <div className="flex flex-col gap-4">
          {(page.records || []).map((record: any, idx: number) => (
            <div
              key={idx}
              className="border border-white/20 bg-black/60 backdrop-blur-sm p-5 flex gap-4 items-start"
            >
              {record.image_url && (
                <img
                  src={record.image_url}
                  alt={record.title}
                  className="w-16 h-16 object-cover shrink-0"
                />
              )}
              <div className="min-w-0">
                <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/50 mb-1">
                  {record.medium} // {record.year}
                </div>
                <h3 className="text-lg font-serif italic font-bold mb-0.5">{record.title}</h3>
                <div className="text-sm font-sans text-white/70 mb-2">{record.artist}</div>
                {record.personalNote && (
                  <p className="text-xs font-mono text-white/60 leading-relaxed">{record.personalNote}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
