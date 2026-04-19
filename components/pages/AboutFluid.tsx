'use client';

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function AboutFluid({ page }: { page: any }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const isNarrow = typeof window !== 'undefined' && window.innerWidth < 768;

    let disposed = false;
    let renderer: any;
    let animationId: number;

    let onMouseMove: (e: MouseEvent) => void;
    let onTouchMove: (e: TouchEvent) => void;
    let onResize: () => void;
    let lastW = typeof window !== 'undefined' ? window.innerWidth : 0;

    (async () => {
      const THREE = await import('three');
      if (disposed) return;

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
      camera.position.z = 5;

      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(isNarrow ? 1 : Math.min(window.devicePixelRatio, 2));
      container.appendChild(renderer.domElement);

      // Blob Geometry & Material — lower segments on narrow viewports
      const segs = isNarrow ? 64 : 128;
      const geometry = new THREE.SphereGeometry(1.5, segs, segs);
      
      const vertexShader = `
        varying vec2 vUv;
        varying vec3 vNormal;
        uniform float uTime;
        uniform vec2 uMouse;

        // Simplex 3D Noise 
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
          
          // Mouse interaction
          float mouseDist = distance(position.xy, uMouse * 3.0);
          float mouseInfluence = smoothstep(2.0, 0.0, mouseDist);
          
          float noise = snoise(vec3(position.x * 1.5 + uTime * 0.2, position.y * 1.5 + uTime * 0.3, position.z * 1.5));
          vec3 newPosition = position + normal * noise * 0.3;
          
          // Bulge towards mouse
          newPosition += normal * mouseInfluence * 0.5;
          
          gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
        }
      `;

      const fragmentShader = `
        varying vec2 vUv;
        varying vec3 vNormal;
        uniform float uTime;

        void main() {
          vec3 normal = normalize(vNormal);
          
          // Iridescent fluid colors
          vec3 color = vec3(
            0.5 + 0.5 * sin(uTime + normal.x * 2.0),
            0.5 + 0.5 * sin(uTime + normal.y * 2.0 + 2.0),
            0.5 + 0.5 * sin(uTime + normal.z * 2.0 + 4.0)
          );
          
          // Fresnel
          vec3 viewDir = vec3(0.0, 0.0, 1.0);
          float fresnel = dot(viewDir, normal);
          fresnel = clamp(1.0 - fresnel, 0.0, 1.0);
          fresnel = pow(fresnel, 3.0);
          
          color = mix(vec3(0.05, 0.05, 0.05), color, fresnel);
          
          gl_FragColor = vec4(color, 0.8);
        }
      `;

      const material = new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: {
          uTime: { value: 0 },
          uMouse: { value: new THREE.Vector2(0, 0) }
        },
        transparent: true,
      });

      const blob = new THREE.Mesh(geometry, material);
      scene.add(blob);

      const mouse = new THREE.Vector2(0, 0);
      const targetMouse = new THREE.Vector2(0, 0);

      onMouseMove = (e: MouseEvent) => {
        targetMouse.x = (e.clientX / window.innerWidth) * 2 - 1;
        targetMouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
      };
      window.addEventListener('mousemove', onMouseMove);

      onTouchMove = (e: TouchEvent) => {
        if (e.touches.length === 0) return;
        targetMouse.x = (e.touches[0].clientX / window.innerWidth) * 2 - 1;
        targetMouse.y = -(e.touches[0].clientY / window.innerHeight) * 2 + 1;
      };
      window.addEventListener('touchmove', onTouchMove, { passive: true });

      onResize = () => {
        // ignore mobile-browser address-bar height jitters
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

        mouse.lerp(targetMouse, 0.05);

        material.uniforms.uTime.value = performance.now() * 0.001;
        material.uniforms.uMouse.value.copy(mouse);

        blob.rotation.y += 0.002;
        blob.rotation.x += 0.001;

        renderer.render(scene, camera);
      };
      animate();

    })();

    return () => {
      disposed = true;
      cancelAnimationFrame(animationId);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('resize', onResize);
      if (renderer) {
        renderer.dispose();
        renderer.forceContextLoss?.();
        if (container.contains(renderer.domElement)) {
          container.removeChild(renderer.domElement);
        }
      }
    };
  }, []);

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-transparent text-white">
      <div ref={containerRef} className="fixed inset-0 z-0 pointer-events-none" />
      
      <div className="relative z-10 px-4 sm:px-10 lg:px-16 xl:px-24 pt-28 sm:pt-36 md:pt-44 pb-16 md:pb-24 min-h-screen flex flex-col justify-start">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="w-full max-w-[1600px] mx-auto"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 xl:gap-20 items-start">
            <div className="lg:col-span-7 xl:col-span-6">
              {page.hero?.eyebrow && (
                <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-white/45 mb-4 mix-blend-difference">
                  {page.hero.eyebrow}
                </p>
              )}
              <h1 className="text-4xl sm:text-6xl md:text-8xl lg:text-[9rem] xl:text-[10rem] font-serif italic tracking-tighter leading-[0.92] mb-6 sm:mb-8 lg:mb-10 mix-blend-difference break-words">
                {page.hero?.title || 'About'}
              </h1>
              <p className="text-base sm:text-xl md:text-2xl xl:text-3xl font-serif italic text-white/80 leading-relaxed mix-blend-difference max-w-2xl">
                {page.hero?.subtitle}
              </p>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.8 }}
              className="lg:col-span-5 xl:col-span-6 flex flex-col gap-8 lg:gap-10 mix-blend-difference lg:pt-2 xl:pt-4"
            >
              {page.hero?.description && (
                <div className="pl-5 border-l border-white/25">
                  <h3 className="font-mono text-xs uppercase tracking-[0.3em] text-white/50 mb-3">Bio</h3>
                  <p className="font-serif text-lg md:text-xl text-white/85 leading-relaxed">
                    {page.hero.description}
                  </p>
                </div>
              )}
              {page.resume?.href && (
                <div className="pl-5 border-l border-white/25">
                  <h3 className="font-mono text-xs uppercase tracking-[0.3em] text-white/50 mb-3">Resume</h3>
                  <a
                    href={page.resume.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group inline-flex flex-col gap-1"
                  >
                    <span className="text-xl sm:text-3xl xl:text-4xl font-serif font-bold uppercase tracking-tight hover:italic transition-all hover:translate-x-1">
                      {page.resume.label || 'Resume'}
                    </span>
                    <span className="font-serif text-sm text-white/50 normal-case tracking-normal">
                      {page.resume.subtitle ? `${page.resume.subtitle} · PDF` : 'PDF'}
                    </span>
                  </a>
                </div>
              )}
              {page.shows?.href && (
                <div className="pl-5 border-l border-white/25">
                  <h3 className="font-mono text-xs uppercase tracking-[0.3em] text-white/50 mb-3">Shows</h3>
                  <Link href={page.shows.href} className="group inline-flex flex-col gap-1">
                    <span className="text-xl sm:text-3xl xl:text-4xl font-serif font-bold uppercase tracking-tight hover:italic transition-all hover:translate-x-1">
                      {page.shows.label || 'Live'}
                    </span>
                    <span className="font-serif text-sm text-white/50 normal-case tracking-normal">
                      {page.shows.subtitle || 'Past performances'}
                    </span>
                  </Link>
                </div>
              )}
              <div className="pl-5 border-l border-white/25 lg:min-h-0">
                <span className="font-mono text-xs uppercase tracking-[0.3em] text-white/50 block mb-5">Links</span>
                <div className="columns-1 sm:columns-2 gap-x-10 gap-y-3 [column-fill:_balance]">
                  {(Array.isArray(page.contact) ? page.contact : page.contact?.links || []).map((link: any, idx: number) => (
                    <a
                      key={idx}
                      href={link.href || link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block break-inside-avoid mb-3 text-xl sm:text-3xl xl:text-4xl font-serif font-bold uppercase tracking-tight hover:italic transition-all hover:translate-x-1"
                    >
                      {link.label}
                    </a>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>

          <div className="mt-16 lg:mt-24 w-full grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-16 xl:gap-24">
            {(page.sections || []).map((section: any, idx: number) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.15 }}
                className="pl-6 border-l border-white/20 mix-blend-difference"
              >
                <h3 className="font-mono text-xs uppercase tracking-[0.3em] text-white/50 mb-4">{section.title}</h3>
                <div className="font-serif text-lg text-white/90 leading-relaxed">
                  {(section.body || section.content || '').split('\n').map((para: string, pIdx: number) => (
                    <p key={pIdx} className="mb-4 last:mb-0">{para}</p>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
