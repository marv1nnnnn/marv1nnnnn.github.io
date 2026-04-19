'use client';

import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';
import { SignalKnowledgePage } from '@/types/scanner';
import ReactMarkdown from 'react-markdown';
import * as THREE from 'three';
import SpriteText from 'three-spritetext';

// Dynamically import ForceGraph3D to avoid SSR issues
const ForceGraph3D = dynamic(() => import('react-force-graph-3d'), {
  ssr: false,
});

export default function KnowledgeGraph({ page, signalId }: { page: SignalKnowledgePage; signalId: string }) {
  const [graphData, setGraphData] = useState<{ nodes: any[]; links: any[] }>({ nodes: [], links: [] });
  const [selectedNode, setSelectedNode] = useState<any | null>(null);
  const [hoverNode, setHoverNode] = useState<any | null>(null);
  const [nodeMarkdown, setNodeMarkdown] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const fgRef = useRef<any>();

  useEffect(() => {
    // Fetch graph data
    fetch('/knowledge/graph.json')
      .then((res) => res.json())
      .then((data) => {
        // Transform edges to links for react-force-graph
        const links = (data.edges || []).map((edge: any) => ({
          ...edge,
          source: edge.from,
          target: edge.to,
        }));
        setGraphData({ nodes: data.nodes || [], links });
      })
      .catch((err) => console.error('Failed to load knowledge graph:', err));
  }, []);

  // Configure smooth 3D controls, auto-rotation, and scene atmosphere (Fog & Lights)
  useEffect(() => {
    // We use a small timeout to ensure the canvas and controls are initialized
    const timer = setTimeout(() => {
      if (fgRef.current) {
        const controls = fgRef.current.controls();
        if (controls) {
          // Enable smooth inertia/damping
          controls.enableDamping = true;
          controls.dampingFactor = 0.05;
          // Use built-in auto-rotation instead of forcing camera position
          // This allows users to interact without fighting the animation
          controls.autoRotate = !selectedNode;
          controls.autoRotateSpeed = 0.5; // Slower, more elegant rotation
        }
        
        // Add cinematic lighting and fog
        const scene = fgRef.current.scene();
        if (scene && !scene.getObjectByName('ambientLight')) {
          // Deep space fog
          scene.fog = new THREE.FogExp2(0x0a0908, 0.0015);
          
          // Soft ambient light
          const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
          ambientLight.name = 'ambientLight';
          scene.add(ambientLight);
          
          // Main directional light (creates highlights on physical materials)
          const dirLight = new THREE.DirectionalLight(0xffffff, 2.5);
          dirLight.position.set(200, 300, 200);
          dirLight.name = 'dirLight';
          scene.add(dirLight);
          
          // Subtle blue rim light from below
          const rimLight = new THREE.PointLight(0x0066ff, 3, 1000);
          rimLight.position.set(-100, -200, -100);
          rimLight.name = 'rimLight';
          scene.add(rimLight);
        }
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [selectedNode, graphData]);

  // Calculate active nodes for performance optimization
  const activeNodeIds = useMemo(() => {
    const ids = new Set<string>();
    if (selectedNode) {
      ids.add(selectedNode.id);
      graphData.links.forEach((l: any) => {
        if (l.source.id === selectedNode.id) ids.add(l.target.id || l.target);
        if (l.target.id === selectedNode.id) ids.add(l.source.id || l.source);
      });
    }
    if (hoverNode) ids.add(hoverNode.id);
    return ids;
  }, [selectedNode, hoverNode, graphData.links]);

  // Search results
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    
    // Score and sort results for better relevance
    const scoredResults = graphData.nodes.map(node => {
      let score = 0;
      const name = node.name.toLowerCase();
      const desc = node.description ? node.description.toLowerCase() : '';
      
      // Exact match in name gets highest score
      if (name === query) score += 100;
      // Starts with query gets high score
      else if (name.startsWith(query)) score += 50;
      // Contains query in name gets medium score
      else if (name.includes(query)) score += 20;
      // Contains query in description gets lower score
      else if (desc.includes(query)) score += 5;
      
      return { node, score };
    });
    
    return scoredResults
      .filter(result => result.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(result => result.node)
      .slice(0, 8); // Limit results
  }, [searchQuery, graphData.nodes]);

  const handleNodeClick = useCallback((node: any) => {
    // Aim at node from outside it
    const distance = 80;
    const distRatio = 1 + distance / Math.hypot(node.x, node.y, node.z);

    if (fgRef.current) {
      fgRef.current.cameraPosition(
        { x: node.x * distRatio, y: node.y * distRatio, z: node.z * distRatio }, // new position
        node, // lookAt ({ x, y, z })
        1200 // ms transition duration (faster, less clunky)
      );
    }
    
    setSelectedNode(node);
    setNodeMarkdown('');
    
    // Fetch node markdown
    fetch(`/knowledge/nodes/${node.id}.md`)
      .then((res) => {
        if (!res.ok) throw new Error('Markdown not found');
        return res.text();
      })
      .then((text) => {
        // Strip redundant frontmatter-like text and H1 from the raw markdown
        const cleanedText = text
          .replace(/^Type:.*$/gm, '')
          .replace(/^Sources:.*$/gm, '')
          .replace(/^# .*$/gm, '')
          .replace(/^\s*[\r\n]/gm, '') // Remove empty lines left behind
          .trim();
        setNodeMarkdown(cleanedText);
      })
      .catch((err) => console.error('Failed to load node markdown:', err));
  }, []);

  // Create a star glow texture
  const glowTexture = useMemo(() => {
    if (typeof document === 'undefined') return null;
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    
    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    // Intense white core
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    // Sharp dropoff for the star body
    gradient.addColorStop(0.1, 'rgba(255, 255, 255, 0.8)');
    // Soft ethereal halo
    gradient.addColorStop(0.4, 'rgba(255, 255, 255, 0.2)');
    // Fade into the void
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 64);
    
    return new THREE.CanvasTexture(canvas);
  }, []);

  return (
    <>
      {/* Search Bar */}
      <div className="fixed top-[4.5rem] sm:top-8 left-1/2 -translate-x-1/2 z-[150] w-[calc(100vw-1.5rem)] sm:w-[90%] max-w-md px-0 sm:px-0">
        <div className="relative">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#b89065" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-60">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search the thought cabinet..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setTimeout(() => setIsSearchFocused(false), 150)}
            className="w-full bg-[#141414]/90 backdrop-blur-md border border-[#b89065]/30 text-[#d4c8b8] font-serif italic py-3 pl-11 pr-4 rounded-sm focus:outline-none focus:border-[#b89065] transition-colors placeholder:text-[#b89065]/40 shadow-2xl"
          />
          <AnimatePresence>
            {isSearchFocused && searchQuery.trim() && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                className="absolute top-full left-0 w-full mt-2 bg-[#141414]/95 backdrop-blur-md border border-[#b89065]/30 rounded-sm overflow-hidden shadow-2xl max-h-[60vh] overflow-y-auto"
              >
                {searchResults.length > 0 ? (
                  searchResults.map((result) => (
                    <div
                      key={result.id}
                      onClick={() => {
                        handleNodeClick(result);
                        setSearchQuery('');
                        setIsSearchFocused(false);
                      }}
                      className="px-4 py-3 hover:bg-[#b89065]/10 cursor-pointer border-b border-[#b89065]/10 last:border-0 transition-colors"
                    >
                      <div className="text-sm font-serif text-[#d4c8b8]">
                        {/* Highlight matching text */}
                        {result.name.split(new RegExp(`(${searchQuery})`, 'gi')).map((part: string, i: number) => 
                          part.toLowerCase() === searchQuery.toLowerCase() ? (
                            <span key={i} className="text-white bg-[#b89065]/30">{part}</span>
                          ) : (
                            <span key={i}>{part}</span>
                          )
                        )}
                      </div>
                      {result.type && (
                        <div className="text-[10px] uppercase tracking-widest text-[#b89065]/60 mt-1">{result.type}</div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-6 text-center text-[#b89065]/60 font-serif italic text-sm">
                    No thoughts found matching "{searchQuery}"
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Background & 3D Graph Container */}
      <div className="fixed inset-0 w-full h-full z-0 bg-[#0a0908] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#1a1714] via-[#0a0908] to-[#050404]">
        <div className="absolute inset-0 md:ml-[10vw]"> {/* Offset to the right slightly to avoid title (desktop only) */}
          <ForceGraph3D
          ref={fgRef}
          graphData={graphData}
          controlType="orbit" // Use OrbitControls for smoother interaction
          nodeLabel="" // Disable default label
          nodeRelSize={4}
          nodeResolution={16}
          linkCurvature={0.2} // Add curvature for organic neural look
          nodeColor={(node: any) => {
            const isSelected = selectedNode && selectedNode.id === node.id;
            const isActive = activeNodeIds.has(node.id);
            return isSelected ? '#ffffff' : (isActive ? '#ffffff' : '#666666');
          }}
          nodeThreeObjectExtend={false}
          nodeThreeObject={(node: any) => {
            const isSelected = selectedNode && selectedNode.id === node.id;
            const isHovered = hoverNode && hoverNode.id === node.id;
            const isActive = activeNodeIds.has(node.id);
            
            // Cyber/Ethereal Color Palette
            let baseColorHex = 0x666666;
            let activeColorHex = 0xffffff;
            let glowColorHex = 0xffffff;
            
            if (node.type === 'concept') {
              baseColorHex = 0x0088aa; // Deep cyan
              activeColorHex = 0x00f0ff; // Neon cyan
              glowColorHex = 0x00f0ff;
            } else if (node.type === 'person') {
              baseColorHex = 0xaa5500; // Deep orange
              activeColorHex = 0xff9d00; // Neon orange
              glowColorHex = 0xff9d00;
            } else if (node.type === 'company' || node.type === 'organization') {
              baseColorHex = 0x008844; // Deep green
              activeColorHex = 0x00ff66; // Matrix green
              glowColorHex = 0x00ff66;
            } else if (node.type === 'book' || node.type === 'article' || node.type === 'source') {
              baseColorHex = 0x8800aa; // Deep purple
              activeColorHex = 0xd000ff; // Neon purple
              glowColorHex = 0xd000ff;
            }
            
            const group = new THREE.Group();
            
            // 1. Core Geometry (Jewel/Glass-like Physical Material)
            const coreRadius = isSelected ? 8 : (isHovered ? 6 : 4);
            let geometry;
            
            if (node.type === 'person') {
              geometry = new THREE.OctahedronGeometry(coreRadius, 0);
            } else if (node.type === 'company' || node.type === 'organization') {
              geometry = new THREE.BoxGeometry(coreRadius * 1.4, coreRadius * 1.4, coreRadius * 1.4);
            } else if (node.type === 'book' || node.type === 'article' || node.type === 'source') {
              geometry = new THREE.TetrahedronGeometry(coreRadius, 0);
            } else {
              geometry = new THREE.SphereGeometry(coreRadius, 32, 32);
            }
            
            // Premium Physical Material instead of Basic
            const material = new THREE.MeshPhysicalMaterial({ 
              color: isSelected ? 0xffffff : (isActive ? activeColorHex : baseColorHex),
              transparent: true,
              opacity: isSelected ? 1 : (isActive ? 0.9 : 0.75),
              roughness: 0.1,
              metalness: 0.5,
              clearcoat: 1.0,
              clearcoatRoughness: 0.1,
              emissive: isSelected ? 0xffffff : (isActive ? activeColorHex : 0x000000),
              emissiveIntensity: isSelected ? 0.8 : (isActive ? 0.5 : 0)
            });
            const mesh = new THREE.Mesh(geometry, material);
            
            if (node.type !== 'concept' && node.type !== undefined) {
              mesh.rotation.x = Math.random() * Math.PI;
              mesh.rotation.y = Math.random() * Math.PI;
            }
            
            group.add(mesh);

            // 2. Star Glow (Ethereal Halo)
            if (glowTexture && (isSelected || isHovered || isActive)) {
              const glowMaterial = new THREE.SpriteMaterial({ 
                map: glowTexture,
                color: isSelected ? 0xffffff : glowColorHex,
                transparent: true,
                blending: THREE.AdditiveBlending,
                depthWrite: false,
                opacity: isSelected ? 1 : (isHovered ? 0.8 : 0.4)
              });
              const sprite = new THREE.Sprite(glowMaterial);
              const glowSize = isSelected ? 32 : (isHovered ? 24 : 16);
              sprite.scale.set(glowSize, glowSize, 1);
              group.add(sprite);
            }
            
            // 3. Constellation Text Label
            const spriteText = new SpriteText(node.name);
            spriteText.color = isSelected ? '#ffffff' : (isActive ? '#' + activeColorHex.toString(16) : '#' + baseColorHex.toString(16));
            spriteText.textHeight = isSelected || isHovered ? 6 : 4;
            spriteText.fontFace = 'serif';
            (spriteText as any).fontStyle = 'italic';
            spriteText.position.y = isSelected || isHovered ? 12 : 8;
            spriteText.material.depthWrite = false;
            spriteText.material.transparent = true;
            spriteText.material.opacity = isSelected ? 1 : (isActive ? 0.9 : 0.6);
            group.add(spriteText);
            
            return group;
          }}
          linkColor={(link: any) => {
            const isHovered = hoverNode && (link.source.id === hoverNode.id || link.target.id === hoverNode.id);
            const isSelected = selectedNode && (link.source.id === selectedNode.id || link.target.id === selectedNode.id);
            const isActive = activeNodeIds.has(link.source.id) && activeNodeIds.has(link.target.id);
            
            if (isSelected || isHovered) return 'rgba(255, 255, 255, 0.8)';
            if (isActive) return 'rgba(255, 255, 255, 0.4)';
            return 'rgba(255, 255, 255, 0.1)';
          }}
          linkWidth={(link: any) => {
            const isHovered = hoverNode && (link.source.id === hoverNode.id || link.target.id === hoverNode.id);
            const isSelected = selectedNode && (link.source.id === selectedNode.id || link.target.id === selectedNode.id);
            const isActive = activeNodeIds.has(link.source.id) && activeNodeIds.has(link.target.id);
            
            if (isSelected || isHovered) return 2.5;
            if (isActive) return 1.5;
            return 0.8;
          }}
          linkDirectionalParticles={(link: any) => {
            const isHovered = hoverNode && (link.source.id === hoverNode.id || link.target.id === hoverNode.id);
            const isSelected = selectedNode && (link.source.id === selectedNode.id || link.target.id === selectedNode.id);
            const isActive = activeNodeIds.has(link.source.id) && activeNodeIds.has(link.target.id);
            
            if (isSelected || isHovered) return 4;
            if (isActive) return 2;
            return 1;
          }}
          linkDirectionalParticleWidth={(link: any) => {
            const isHovered = hoverNode && (link.source.id === hoverNode.id || link.target.id === hoverNode.id);
            const isSelected = selectedNode && (link.source.id === selectedNode.id || link.target.id === selectedNode.id);
            const isActive = activeNodeIds.has(link.source.id) && activeNodeIds.has(link.target.id);
            
            if (isSelected || isHovered) return 3;
            if (isActive) return 2;
            return 1;
          }}
          linkDirectionalParticleSpeed={0.005}
          linkDirectionalParticleColor={(link: any) => {
            const isSelected = selectedNode && (link.source.id === selectedNode.id || link.target.id === selectedNode.id);
            const isHovered = hoverNode && (link.source.id === hoverNode.id || link.target.id === hoverNode.id);
            
            if (isSelected || isHovered) return 'rgba(255, 255, 255, 0.9)';
            return 'rgba(255, 255, 255, 0.5)';
          }}
          backgroundColor="rgba(0,0,0,0)"
          onNodeClick={handleNodeClick}
          onNodeHover={(node) => setHoverNode(node)}
          onBackgroundClick={() => setSelectedNode(null)}
          enableNodeDrag={false}
          showNavInfo={false}
        />
        </div>
      </div>

      {/* Info Panel - Disco Elysium Style */}
      <AnimatePresence>
        {selectedNode && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
            className="fixed top-0 right-0 h-full w-full md:w-[450px] bg-[#141414]/95 backdrop-blur-3xl border-l-2 border-[#b89065]/40 p-6 sm:p-8 md:p-12 pt-16 sm:pt-20 md:pt-12 text-[#d4c8b8] z-[200] overflow-y-auto shadow-2xl"
          >
            <button
              onClick={() => setSelectedNode(null)}
              aria-label="Close"
              className="absolute top-3 right-3 sm:top-8 sm:right-8 p-3 text-[#b89065] hover:text-white bg-[#b89065]/10 hover:bg-[#b89065]/20 sm:bg-transparent rounded-full transition-colors"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
            
            <div className="font-sans text-[10px] uppercase tracking-[0.3em] text-[#b89065] mb-4 flex items-center gap-4">
              <div className="w-4 h-[1px] bg-[#b89065]/50" />
              {selectedNode.type || 'Node'}
            </div>
            
            {/* If markdown has its own H1, we hide our H2 to avoid duplication */}
            {!nodeMarkdown.includes(`# ${selectedNode.name}`) && (
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif italic tracking-tight mb-6 sm:mb-8 leading-tight text-white break-words">{selectedNode.name}</h2>
            )}
            
            {/* Type and Sources Layout Fix */}
            <div className="mb-10 flex flex-col gap-6">
              {selectedNode.type && (
                <div className="flex flex-col gap-2">
                  <span className="font-sans text-[10px] uppercase tracking-[0.3em] text-[#b89065]/50">Type</span>
                  <span className="font-serif italic text-lg text-[#d4c8b8]">{selectedNode.type}</span>
                </div>
              )}
              
              {selectedNode.sources && selectedNode.sources.length > 0 && (
                <div className="flex flex-col gap-3">
                  <span className="font-sans text-[10px] uppercase tracking-[0.3em] text-[#b89065]/50">Sources</span>
                  <ul className="space-y-2">
                    {selectedNode.sources.map((source: string, idx: number) => {
                      let hostname = source;
                      try {
                        hostname = new URL(source).hostname;
                        // Clean up common prefixes like www.
                        hostname = hostname.replace(/^www\./, '');
                      } catch (e) {
                        // Keep original if not a valid URL
                      }
                      
                      return (
                        <li key={idx} className="flex items-start gap-2">
                          <div className="mt-1.5 w-1 h-1 bg-[#b89065]/40 rounded-full shrink-0" />
                          <a 
                            href={source} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-sm font-serif text-[#b89065]/90 hover:text-[#d4c8b8] underline underline-offset-4 decoration-[#b89065]/30 hover:decoration-[#d4c8b8] transition-colors break-all"
                          >
                            {hostname}
                          </a>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>
            
            {nodeMarkdown ? (
              <div className="text-base text-[#d4c8b8]/90 leading-relaxed mb-12 
                [&>h1]:text-4xl [&>h1]:md:text-5xl [&>h1]:font-serif [&>h1]:italic [&>h1]:tracking-tight [&>h1]:text-white [&>h1]:mb-8 [&>h1]:leading-tight
                [&>h2]:text-xl [&>h2]:font-serif [&>h2]:italic [&>h2]:text-[#b89065] [&>h2]:mt-10 [&>h2]:mb-4
                [&>p]:mb-5 [&>p]:font-serif
                [&>ul]:list-none [&>ul]:pl-0 [&>ul]:mb-8 [&>ul>li]:relative [&>ul>li]:pl-5 [&>ul>li]:mb-3 [&>ul>li]:font-serif [&>ul>li]:before:content-[''] [&>ul>li]:before:absolute [&>ul>li]:before:left-0 [&>ul>li]:before:top-[0.6em] [&>ul>li]:before:w-1.5 [&>ul>li]:before:h-1.5 [&>ul>li]:before:bg-[#b89065]/60 [&>ul>li]:before:rotate-45
                [&>a]:text-[#b89065] [&>a]:underline [&>a]:underline-offset-4 [&>a]:decoration-[#b89065]/30 hover:[&>a]:decoration-[#b89065]
                [&>blockquote]:border-l-2 [&>blockquote]:border-[#b89065]/40 [&>blockquote]:pl-5 [&>blockquote]:italic [&>blockquote]:text-[#d4c8b8]/60 [&>blockquote]:font-serif"
              >
                <ReactMarkdown>{nodeMarkdown}</ReactMarkdown>
              </div>
            ) : selectedNode.description ? (
              <p className="text-base font-serif text-[#d4c8b8]/90 leading-relaxed mb-12">
                {selectedNode.description}
              </p>
            ) : null}
            
            {/* Find connected nodes */}
            {(() => {
              const connectedLinks = graphData.links.filter(
                (l: any) => l.source.id === selectedNode.id || l.target.id === selectedNode.id
              );
              if (connectedLinks.length === 0) return null;
              
              return (
                <div className="mt-12 pt-8 border-t border-[#b89065]/20">
                  <div className="font-sans text-[10px] uppercase tracking-[0.3em] text-[#b89065] mb-6 flex items-center gap-4">
                    <div className="w-4 h-[1px] bg-[#b89065]/50" />
                    Connections
                  </div>
                  <ul className="space-y-5">
                    {connectedLinks.map((l: any, idx: number) => {
                      const isSource = l.source.id === selectedNode.id;
                      const otherNode = isSource ? l.target : l.source;
                      return (
                        <li 
                          key={idx} 
                          className="group cursor-pointer"
                          onClick={() => handleNodeClick(otherNode)}
                        >
                          <div className="flex items-center gap-3 mb-1.5">
                            <div className="w-1.5 h-1.5 bg-[#b89065]/40 rotate-45 group-hover:bg-[#b89065] transition-colors" />
                            <span className="text-base font-serif italic text-[#d4c8b8] group-hover:text-white transition-colors">{otherNode.name}</span>
                          </div>
                          {l.quote && <p className="text-sm font-serif text-[#d4c8b8]/50 pl-5 italic leading-relaxed">"{l.quote}"</p>}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })()}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}