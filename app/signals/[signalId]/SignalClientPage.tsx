'use client';

import { Signal } from '@/types/scanner';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import StaircaseScene from '@/components/StaircaseScene';
import AboutFluid from '@/components/pages/AboutFluid';
import ProjectsRiver from '@/components/pages/ProjectsRiver';
import InfluencesVortex from '@/components/pages/InfluencesVortex';
import ListeningRipples from '@/components/pages/ListeningRipples';
import JournalSmoke from '@/components/pages/JournalSmoke';

export default function SignalClientPage({ signal, signalId }: { signal: Signal; signalId: string }) {
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    document.body.className = `antialiased theme-${signalId}`;
    return () => {
      document.body.className = 'antialiased';
    };
  }, [signalId]);

  const handleSelect = useCallback(
    (id: string) => {
      if (signal.page.type === 'cards') {
        router.push(`/signals/${signalId}/${id}`);
      } else if (signal.page.type === 'list') {
        const item = signal.page.items.find((i: any) => i.title === id);
        if (item?.url) window.open(item.url, '_blank');
      }
    },
    [router, signalId, signal.page]
  );

  const { page } = signal;

  const staircaseItems = useMemo(() => {
    if (page.type === 'cards') {
      return page.cards.map((card: any) => ({
        id: card.id,
        title: card.title,
        subtitle: card.summary ? card.summary.slice(0, 40) + '...' : 'Fragment',
        meta: card.date ? card.date.replace(/-/g, '.') : '',
      }));
    } else if (page.type === 'list') {
      return page.items.map((item: any) => ({
        id: item.title,
        title: item.title,
        subtitle: item.type,
        meta: item.creator,
        onClick: () => item.url && window.open(item.url, '_blank'),
      }));
    }
    return [];
  }, [page]);

  if (!mounted) return null;

  return (
    <>
      <div className="noise-overlay" />

      <AnimatePresence>
        <motion.div
          key={signalId}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.15 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 pointer-events-none z-[-1]"
          style={{
            backgroundImage:
              signalId === 'about'
                ? 'radial-gradient(circle, currentColor 2px, transparent 2px)'
                : signalId === 'projects'
                  ? 'linear-gradient(90deg, currentColor 1px, transparent 1px)'
                  : signalId === 'listening'
                    ? 'repeating-linear-gradient(45deg, currentColor 0, currentColor 1px, transparent 1px, transparent 60px)'
                    : signalId === 'influences'
                      ? 'linear-gradient(135deg, currentColor 2px, transparent 2px), linear-gradient(45deg, currentColor 2px, transparent 2px)'
                      : 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)',
            backgroundSize: '40px 40px',
            filter: 'blur(1px)',
          }}
        />
      </AnimatePresence>

      <div className="fixed top-8 left-8 md:top-12 md:left-12 z-[100] mix-blend-difference">
        <Link href="/" className="group flex items-center gap-4 text-white">
          <div className="w-6 h-[1px] bg-white opacity-50 group-hover:w-10 transition-all"></div>
          <motion.span
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="font-mono text-[10px] uppercase tracking-[0.3em]"
          >
            Back
          </motion.span>
        </Link>
      </div>

      {/* Header — profile pages render their own hero in AboutFluid; skip duplicate title to avoid overlap */}
      <div
        className={`fixed left-8 md:left-12 z-[100] mix-blend-difference pointer-events-none ${
          page.type === 'profile' ? 'top-24 max-w-[min(90vw,22rem)]' : 'top-24'
        }`}
      >
        {page.type !== 'profile' && (
          <h1 className="text-5xl md:text-7xl lg:text-[8rem] font-serif italic tracking-tighter lowercase leading-none text-white kinetic-text">
            {signal.title}
          </h1>
        )}
        {page.type !== 'profile' && (
          <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/40 flex items-center gap-4 mt-6">
            <div className="w-8 h-[1px] bg-white/40 shrink-0" />
            {page.type}
          </div>
        )}
      </div>

      {/* Content Rendering */}
      {page.type === 'profile' && <AboutFluid page={page} />}

      {page.type === 'influences' && <InfluencesVortex page={page} />}

      {page.type === 'list' && signalId === 'listening' && <ListeningRipples page={page} />}

      {page.type === 'cards' && signalId === 'journal' && <JournalSmoke page={page} signalId={signalId} />}

      {(page.type === 'cards' || page.type === 'list') && signalId !== 'projects' && signalId !== 'listening' && signalId !== 'journal' && (
        <>
          <StaircaseScene 
            items={staircaseItems}
            onHover={() => {}}
            onSelect={handleSelect}
          />
          <div style={{ height: '300vh' }} aria-hidden="true" />
        </>
      )}

      {signalId === 'projects' && <ProjectsRiver page={page} signalId={signalId} />}
    </>
  );
}
