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

    const onClick = () => {
      if (hoveredIndex !== null) {
        const item = items[hoveredIndex];
        if (item.onClick) {
          item.onClick();
        } else {
          onSelectRef.current(item.id);
        }
      }
    };

    const onResize = () => {
      if (!renderer || !camera) return;
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    const mouse = { x: 0, y: 0 };
    let camera: any = null;
    let hoveredIndex: number | null = null;

    (async () => {
      const THREE = await import('three');
      if (disposed) return;

      const scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
      camera.position.set(12, 4, 18);
      camera.lookAt(0, -2, 0);

      renderer = new THREE.WebGLRenderer({ 
        antialias: true, 
        alpha: true,
        powerPreference: "high-performance",
        precision: "mediump"
      });
      
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
      renderer.setClearColor(0x000000, 0);
      
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
      scene.add(spiralGroup);

      const glassMaterial = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        metalness: 0.2,
        roughness: 0.1,
        transparent: true,
        opacity: 0.3,
      });

      const edgeMaterial = new THREE.LineBasicMaterial({ 
        color: 0xffffff, 
        transparent: true, 
        opacity: 0.2,
      });

      const stepGeometry = new THREE.BoxGeometry(STEP_WIDTH, STEP_THICKNESS, STEP_DEPTH);
      const edgesGeometry = new THREE.EdgesGeometry(stepGeometry);

      const stepMeshes: Mesh[] = [];
      const stepGroups: THREE.Group[] = [];

      items.forEach((item, index) => {
        const stepGroup = new THREE.Group();
        const y = -index * STEP_HEIGHT;
        const rotY = index * RAD_PER_STEP + INITIAL_ROT;
        stepGroup.position.set(0, y, 0);
        stepGroup.rotation.set(0, rotY, 0);

        const mesh = new THREE.Mesh(stepGeometry, glassMaterial);
        mesh.position.set(STEP_WIDTH / 2, 0, 0);
        mesh.userData = { id: item.id, index };
        stepGroup.add(mesh);
        stepMeshes.push(mesh);

        const lineSegments = new THREE.LineSegments(edgesGeometry, edgeMaterial);
        lineSegments.position.set(STEP_WIDTH / 2, 0, 0);
        stepGroup.add(lineSegments);

        spiralGroup.add(stepGroup);
        stepGroups.push(stepGroup);
      });

      labelsContainer = document.createElement('div');
      labelsContainer.style.cssText = 'position:absolute;inset:0;pointer-events:none;overflow:hidden;z-index:10;';
      container.appendChild(labelsContainer);

      const labelElements: HTMLDivElement[] = [];
      items.forEach((item, index) => {
        const label = document.createElement('div');
        label.style.cssText = `
          position:absolute;
          pointer-events:none;
          white-space:nowrap;
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
          <div style="display:flex; align-items:center; gap:1rem;">
            <span style="font-family:monospace;font-size:10px;opacity:0.4;text-transform:uppercase;letter-spacing:0.5em;background:rgba(255,255,255,0.1);padding:2px 6px;border-radius:2px;">
              ${String(index + 1).padStart(2, '0')}
            </span>
            <span style="font-size:2.4rem;letter-spacing:-0.04em;font-weight:900;font-style:italic;text-transform:uppercase;">
              ${item.title}
            </span>
          </div>
          <div style="display:flex; align-items:center; gap:1rem; margin-left:3.5rem;">
            ${item.subtitle ? `
            <span style="font-family:monospace;font-size:10px;opacity:0.6;text-transform:uppercase;letter-spacing:0.2em;font-style:normal;">
              // ${item.subtitle}
            </span>
            ` : ''}
          </div>
        `;
        labelsContainer!.appendChild(label);
        labelElements.push(label);
      });

      const raycaster = new THREE.Raycaster();

      window.addEventListener('pointermove', onPointerMove, { passive: true });
      renderer.domElement.addEventListener('click', onClick);

      let smoothScroll = 0;

      const animate = () => {
        if (disposed || !renderer) return;
        animationId = requestAnimationFrame(animate);

        const currentScroll = window.scrollY;
        smoothScroll += (currentScroll - smoothScroll) * 0.1;
        
        const maxScroll = Math.max(1, document.body.scrollHeight - window.innerHeight);
        const t = Math.min(smoothScroll / maxScroll, 1);
        
        const totalHeight = (items.length - 1) * STEP_HEIGHT;
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

        const _q = new THREE.Quaternion();
        const _frontOffset = new THREE.Vector3();
        const worldPos = new THREE.Vector3();

        items.forEach((_, index) => {
          const mesh = stepMeshes[index];
          if (!mesh) return;

          mesh.getWorldPosition(worldPos);
          mesh.getWorldQuaternion(_q);
          
          _frontOffset.set(STEP_WIDTH / 4, 0, STEP_DEPTH / 2 + 0.2);
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
              label.style.opacity = String(Math.min(1, scale * facing * (isHovered ? 1.2 : 1)));
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
