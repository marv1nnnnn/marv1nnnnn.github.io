'use client';

import { useRef, useEffect } from 'react';
import type { Mesh, WebGLRenderer, Scene, PerspectiveCamera, Group } from 'three';

const STEP_HEIGHT = 1.8;
const STEP_WIDTH = 12;
const STEP_DEPTH = 4;
const STEP_THICKNESS = 0.08;
const DEG_PER_STEP = -25;
const RAD_PER_STEP = DEG_PER_STEP * (Math.PI / 180);
const INITIAL_ROT = 0;

export interface StaircaseItem {
  id: string;
  title: string;
  subtitle?: string;
  meta?: string;
  href?: string;
  onClick?: () => void;
}

export default function StaircaseScene({
  items,
  onHover,
  onSelect,
}: {
  items: StaircaseItem[];
  onHover: (id: string | null) => void;
  onSelect: (id: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const onHoverRef = useRef(onHover);
  const onSelectRef = useRef(onSelect);
  
  onHoverRef.current = onHover;
  onSelectRef.current = onSelect;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Clear container completely on mount to prevent any lingering DOM elements from previous renders
    container.innerHTML = '';

    let disposed = false;
    let renderer: WebGLRenderer | null = null;
    let animationId: number;
    let labelsContainer: HTMLDivElement | null = null;

    const cleanup = () => {
      disposed = true;
      cancelAnimationFrame(animationId);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('resize', onResize);
      
      if (renderer) {
        renderer.domElement.removeEventListener('click', onClick);
        renderer.domElement.removeEventListener('touchend', onTouchEnd);
        renderer.dispose();
        renderer.forceContextLoss();
        if (container.contains(renderer.domElement)) {
          container.removeChild(renderer.domElement);
        }
        renderer = null;
      }

      if (labelsContainer && container.contains(labelsContainer)) {
        container.removeChild(labelsContainer);
      }
      
      // Safety net: clear container again on unmount
      container.innerHTML = '';
    };

    const onPointerMove = (e: MouseEvent) => {
      mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };

    const mouse = { x: 0, y: 0 };
    let camera: any = null;
    let hoveredIndex: number | null = null;
    let isTransitioning = false;
    let transitionTargetIndex: number | null = null;
    let transitionProgress = 0;
    let touchTappedIndex: number | null = null;

    const onClick = () => {
      if (hoveredIndex !== null && !isTransitioning) {
        const item = items[hoveredIndex];
        if (item.onClick) {
          item.onClick();
        } else {
          isTransitioning = true;
          transitionTargetIndex = hoveredIndex;
        }
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (isTransitioning || !camera || !stepMeshesRef.length) return;
      const touch = e.changedTouches[0];
      if (!touch) return;

      mouse.x = (touch.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(touch.clientY / window.innerHeight) * 2 + 1;

      const THREE_mod = (window as any).__THREE__;
      if (!THREE_mod || !raycasterRef) return;

      raycasterRef.setFromCamera(mouse as any, camera);
      const intersects = raycasterRef.intersectObjects(stepMeshesRef);
      const tappedIdx = intersects.length > 0
        ? (intersects[0].object.userData.index as number)
        : null;

      if (tappedIdx === null) {
        touchTappedIndex = null;
        hoveredIndex = null;
        onHoverRef.current(null);
        return;
      }

      if (touchTappedIndex === tappedIdx) {
        const item = items[tappedIdx];
        if (item.onClick) {
          item.onClick();
        } else {
          isTransitioning = true;
          transitionTargetIndex = tappedIdx;
        }
        touchTappedIndex = null;
      } else {
        touchTappedIndex = tappedIdx;
        hoveredIndex = tappedIdx;
        onHoverRef.current(items[tappedIdx].id);
      }
    };

    let stepMeshesRef: any[] = [];
    let raycasterRef: any = null;

    const onResize = () => {
      if (!renderer || !camera) return;
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    (async () => {
      const THREE = await import('three');
      if (disposed) return;

      const scene = new THREE.Scene();
      const isPortrait = window.innerWidth < 768;
      camera = new THREE.PerspectiveCamera(isPortrait ? 70 : 45, window.innerWidth / window.innerHeight, 0.1, 1000);
      if (isPortrait) {
        camera.position.set(4, 1, 13);
        camera.lookAt(4, -2, 0);
      } else {
        camera.position.set(12, 4, 18);
        camera.lookAt(0, -2, 0);
      }

      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
        precision: "mediump"
      });

      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
      renderer.setClearColor(0x000000, 0);
      renderer.localClippingEnabled = isPortrait;
      const portraitClipPlane = isPortrait
        ? new THREE.Plane(new THREE.Vector3(1, 0, 0), 0)
        : null;
      
      renderer.domElement.style.opacity = '0';
      renderer.domElement.style.transition = 'opacity 0.4s ease-out';
      container.appendChild(renderer.domElement);

      const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
      scene.add(ambientLight);

      const mainLight = new THREE.DirectionalLight(0xffffff, 1.2);
      mainLight.position.set(5, 10, 7);
      scene.add(mainLight);

      const spiralGroup = new THREE.Group();
      spiralGroup.position.set(0, 2, 0);
      if (isPortrait) {
        spiralGroup.scale.set(0.55, 0.55, 0.55);
      }
      scene.add(spiralGroup);

      const liquidVertexShader = `
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vViewPosition;
        uniform float uTime;
        uniform float uHover;
        uniform float uIndex;

        // Simplex 3D Noise 
        // by Ian McEwan, Ashima Arts
        vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
        vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}

        float snoise(vec3 v){ 
          const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
          const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);

          // First corner
          vec3 i  = floor(v + dot(v, C.yyy) );
          vec3 x0 = v - i + dot(i, C.xxx) ;

          // Other corners
          vec3 g = step(x0.yzx, x0.xyz);
          vec3 l = 1.0 - g;
          vec3 i1 = min( g.xyz, l.zxy );
          vec3 i2 = max( g.xyz, l.zxy );

          //  x0 = x0 - 0.0 + 0.0 * C 
          vec3 x1 = x0 - i1 + 1.0 * C.xxx;
          vec3 x2 = x0 - i2 + 2.0 * C.xxx;
          vec3 x3 = x0 - 1.0 + 3.0 * C.xxx;

          // Permutations
          i = mod(i, 289.0 ); 
          vec4 p = permute( permute( permute( 
                     i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
                   + i.y + vec4(0.0, i1.y, i2.y, 1.0 )) 
                   + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));

          // Gradients
          // ( N*N points uniformly over a square, mapped onto an octahedron.)
          float n_ = 1.0/7.0; // N=7
          vec3  ns = n_ * D.wyz - D.xzx;

          vec4 j = p - 49.0 * floor(p * ns.z *ns.z);  //  mod(p,N*N)

          vec4 x_ = floor(j * ns.z);
          vec4 y_ = floor(j - 7.0 * x_ );    // mod(j,N)

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

          //Normalise gradients
          vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
          p0 *= norm.x;
          p1 *= norm.y;
          p2 *= norm.z;
          p3 *= norm.w;

          // Mix final noise value
          vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
          m = m * m;
          return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), 
                                        dot(p2,x2), dot(p3,x3) ) );
        }

        void main() {
          vUv = uv;
          vNormal = normal;
          
          float noise = snoise(vec3(position.x * 0.5 + uTime * 0.5, position.y * 0.5, position.z * 0.5 + uIndex));
          vec3 newPosition = position + normal * noise * (0.5 + uHover * 0.5);
          
          vec4 mvPosition = modelViewMatrix * vec4(newPosition, 1.0);
          vViewPosition = -mvPosition.xyz;
          gl_Position = projectionMatrix * mvPosition;
        }
      `;

      const liquidFragmentShader = `
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vViewPosition;
        uniform float uTime;
        uniform float uHover;
        
        void main() {
          vec3 normal = normalize(vNormal);
          vec3 viewDir = normalize(vViewPosition);
          
          // Fresnel effect
          float fresnel = dot(viewDir, normal);
          fresnel = clamp(1.0 - fresnel, 0.0, 1.0);
          fresnel = pow(fresnel, 3.0);
          
          // Iridescence / Chromatic aberration based on view angle and time
          vec3 color = vec3(0.0);
          color.r = sin(uTime * 0.5 + fresnel * 5.0) * 0.5 + 0.5;
          color.g = sin(uTime * 0.6 + fresnel * 5.0 + 2.0) * 0.5 + 0.5;
          color.b = sin(uTime * 0.7 + fresnel * 5.0 + 4.0) * 0.5 + 0.5;
          
          // Mix with base color (dark/glassy)
          vec3 baseColor = vec3(0.1, 0.1, 0.15);
          vec3 finalColor = mix(baseColor, color, fresnel * 0.8 + uHover * 0.5);
          
          // Specular highlight
          vec3 lightDir = normalize(vec3(1.0, 1.0, 1.0));
          vec3 halfVector = normalize(lightDir + viewDir);
          float specular = max(0.0, dot(normal, halfVector));
          specular = pow(specular, 64.0);
          
          finalColor += vec3(1.0) * specular * 0.5;
          
          gl_FragColor = vec4(finalColor, 0.8 + uHover * 0.2);
        }
      `;

      const stepGeometry = new THREE.SphereGeometry(STEP_WIDTH / 3, 64, 64);
      // We'll stretch it to look like a liquid drop/band
      stepGeometry.scale(1.5, 0.2, 0.5);

      const stepMeshes: Mesh[] = [];
      const stepGroups: Group[] = [];
      const materials: any[] = [];

      items.forEach((item, index) => {
        const stepGroup = new THREE.Group();
        const y = -index * STEP_HEIGHT;
        const rotY = index * RAD_PER_STEP + INITIAL_ROT;
        stepGroup.position.set(0, y, 0);
        stepGroup.rotation.set(0, rotY, 0);

        const material = new THREE.ShaderMaterial({
          vertexShader: liquidVertexShader,
          fragmentShader: liquidFragmentShader,
          uniforms: {
            uTime: { value: 0 },
            uHover: { value: 0 },
            uIndex: { value: index }
          },
          transparent: true,
          side: THREE.DoubleSide,
          clippingPlanes: portraitClipPlane ? [portraitClipPlane] : []
        });
        materials.push(material);

        const mesh = new THREE.Mesh(stepGeometry, material);
        mesh.position.set(STEP_WIDTH / 2, 0, 0);
        mesh.userData = { id: item.id, index };
        stepGroup.add(mesh);
        stepMeshes.push(mesh);

        spiralGroup.add(stepGroup);
        stepGroups.push(stepGroup);
      });

      labelsContainer = document.createElement('div');
      labelsContainer.style.cssText = 'position:absolute;inset:0;pointer-events:none;overflow:hidden;z-index:10;';
      container.appendChild(labelsContainer);

      const isMobile = window.innerWidth < 768;
      const titleSize = isMobile ? '1.4rem' : '2.4rem';
      const subtitleMargin = isMobile ? '2rem' : '3.5rem';

      const labelElements: HTMLDivElement[] = [];
      items.forEach((item, index) => {
        const label = document.createElement('div');
        label.style.cssText = `
          position:absolute;
          pointer-events:none;
          font-family:Georgia,serif;
          color:#fff;
          transform-origin:center;
          display:flex;
          flex-direction:column;
          align-items:flex-start;
          gap:0.2rem;
          opacity:0;
          will-change: transform, opacity;
          text-shadow: 0 0 10px rgba(255,255,255,0.3);
        `;
        label.innerHTML = `
          <div style="display:flex; align-items:center; gap:${isMobile ? '0.5rem' : '1rem'};">
            <span style="font-family:monospace;font-size:${isMobile ? '8px' : '10px'};opacity:0.4;text-transform:uppercase;letter-spacing:0.5em;background:rgba(255,255,255,0.1);padding:2px 6px;border-radius:2px;">
              ${String(index + 1).padStart(2, '0')}
            </span>
            <span style="font-size:${titleSize};letter-spacing:-0.04em;font-weight:900;font-style:italic;text-transform:uppercase;">
              ${item.title}
            </span>
          </div>
          <div style="display:flex; align-items:center; gap:1rem; margin-left:${subtitleMargin};">
            ${item.subtitle ? `
            <span style="font-family:monospace;font-size:${isMobile ? '8px' : '10px'};opacity:0.6;text-transform:uppercase;letter-spacing:0.2em;font-style:normal;">
              // ${item.subtitle}
            </span>
            ` : ''}
          </div>
        `;
        labelsContainer!.appendChild(label);
        labelElements.push(label);
      });

      const raycaster = new THREE.Raycaster();
      raycasterRef = raycaster;
      stepMeshesRef = stepMeshes;
      (window as any).__THREE__ = THREE;

      window.addEventListener('pointermove', onPointerMove, { passive: true });
      renderer.domElement.addEventListener('click', onClick);
      renderer.domElement.addEventListener('touchend', onTouchEnd, { passive: true });

      let smoothScroll = 0;

      const animate = () => {
        if (disposed || !renderer) return;
        animationId = requestAnimationFrame(animate);

        const time = performance.now() * 0.001;

        if (isTransitioning && transitionTargetIndex !== null) {
          transitionProgress += 0.02;
          if (transitionProgress >= 1) {
            transitionProgress = 1;
            onSelectRef.current(items[transitionTargetIndex].id);
            isTransitioning = false; // Reset or leave it true to freeze
          }

          const targetMesh = stepMeshes[transitionTargetIndex];
          const targetPos = new THREE.Vector3();
          targetMesh.getWorldPosition(targetPos);

          // Move camera towards the target mesh
          camera.position.lerp(targetPos.clone().add(new THREE.Vector3(0, 0, 2)), 0.05);
          camera.lookAt(targetPos);

          // Melt effect: increase noise scale and stretch
          materials.forEach((mat, i) => {
            mat.uniforms.uTime.value = time;
            if (i === transitionTargetIndex) {
              mat.uniforms.uHover.value += (5.0 - mat.uniforms.uHover.value) * 0.05;
            } else {
              mat.uniforms.uHover.value += (0.0 - mat.uniforms.uHover.value) * 0.1;
            }
          });
        } else {
          const currentScroll = window.scrollY;
          smoothScroll += (currentScroll - smoothScroll) * 0.1;
          
          const maxScroll = Math.max(1, document.body.scrollHeight - window.innerHeight);
          const t = Math.min(smoothScroll / maxScroll, 1);
          
          const totalHeight = (items.length - 1) * STEP_HEIGHT * spiralGroup.scale.y;
          const totalRot = (items.length - 1) * Math.abs(RAD_PER_STEP);

          spiralGroup.position.y = t * totalHeight * 1.1;
          spiralGroup.rotation.y = t * totalRot * 1.1;

          raycaster.setFromCamera(mouse as any, camera);
          const intersects = raycaster.intersectObjects(stepMeshes);
          const newHoveredIndex = intersects.length > 0
            ? (intersects[0].object.userData.index as number)
            : null;

          if (newHoveredIndex !== hoveredIndex) {
            hoveredIndex = newHoveredIndex;
            if (hoveredIndex !== null) {
              document.body.style.cursor = 'pointer';
              onHoverRef.current(items[hoveredIndex].id);
            } else {
              document.body.style.cursor = '';
              onHoverRef.current(null);
            }
          }

          materials.forEach((mat, i) => {
            mat.uniforms.uTime.value = time;
            // Smoothly interpolate hover state
            const targetHover = i === hoveredIndex ? 1.0 : 0.0;
            mat.uniforms.uHover.value += (targetHover - mat.uniforms.uHover.value) * 0.1;
          });
        }

        const _q = new THREE.Quaternion();
        const _frontOffset = new THREE.Vector3();
        const worldPos = new THREE.Vector3();

        items.forEach((_, index) => {
          const mesh = stepMeshes[index];
          if (!mesh) return;

          mesh.getWorldPosition(worldPos);
          mesh.getWorldQuaternion(_q);

          const groupScale = spiralGroup.scale.x;

          // Hide label when the mesh is on the clipped (negative-x) side in portrait
          if (portraitClipPlane && worldPos.x < 0.2) {
            const label = labelElements[index];
            label.style.opacity = '0';
            return;
          }

          const offsetMul = groupScale < 0.6 ? 1.6 : 1;
          _frontOffset.set((STEP_WIDTH / 4) * groupScale * offsetMul, 0, (STEP_DEPTH / 2 + 0.2) * groupScale * offsetMul);
          _frontOffset.applyQuaternion(_q);
          worldPos.add(_frontOffset);

          const projected = worldPos.clone().project(camera);
          const label = labelElements[index];

          if (projected.z > 0 && projected.z < 1) {
            const x = (projected.x * 0.5 + 0.5) * window.innerWidth;
            const y = (-projected.y * 0.5 + 0.5) * window.innerHeight;
            const dist = worldPos.distanceTo(camera.position);
            const facing = _frontOffset.normalize().dot(
              camera.position.clone().sub(worldPos).normalize()
            );

            if (facing > -0.1) {
              const scale = Math.max(0.3, Math.min(1.1, 8 / dist));
              const isHovered = hoveredIndex === index;
              
              label.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-20%, -50%) scale(${scale * (isHovered ? 1.1 : 1)})`;
              
              // Fade out labels during transition
              const targetOpacity = isTransitioning ? 0 : Math.min(1, scale * facing * (isHovered ? 1.2 : 1));
              const currentOpacity = parseFloat(label.style.opacity || '0');
              label.style.opacity = String(currentOpacity + (targetOpacity - currentOpacity) * 0.1);
              
              label.style.zIndex = isHovered ? '100' : '10';
            } else {
              label.style.opacity = '0';
            }
          } else {
            label.style.opacity = '0';
          }
        });

        renderer.render(scene, camera);
        
        if (renderer.domElement.style.opacity === '0') {
          renderer.domElement.style.opacity = '1';
        }
      };

      animate();

      window.addEventListener('resize', onResize, { passive: true });
    })();

    return cleanup;
  }, [items]);

  return (
    <div
      ref={containerRef}
      style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'auto' }}
    />
  );
}
