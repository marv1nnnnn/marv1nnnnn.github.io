'use client';

import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import type { Signal, SignalCardsPage, SignalProfilePage, SignalListPage, SignalInfluencesPage } from '@/types/scanner';
import SignalCard from './SignalCard';
import InfluencesPage from './InfluencesPage';
import DecodedText from '@/components/effects/DecodedText';
import { motion, AnimatePresence } from 'framer-motion';

const ProjectSinglePage = dynamic(() => import('./ProjectSinglePage'), {
  loading: () => <div className="text-mono text-center p-12 animate-pulse font-bold opacity-30 tracking-[1em]">FETCHING_DATA_...</div>
});

interface ZineViewerProps {
  signal: Signal;
  clarity: number;
}

function ProfilePage({ page }: { page: SignalProfilePage }) {
  return (
    <div className="flex flex-col gap-12 max-w-7xl mx-auto py-20 px-8">
      {/* Hero Section: Extreme Modernist */}
      <div className="flex flex-col gap-8 border-l-[12px] border-white pl-12 py-8">
         <h2 className="text-[8vw] font-black leading-[0.8] mb-8">
            <DecodedText text={page.hero.title} revealSpeed={40} />
         </h2>
         <p className="text-2xl md:text-4xl font-light leading-relaxed max-w-4xl opacity-80 font-sans tracking-tight">
            {page.hero.description}
         </p>
      </div>

      {/* Grid Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-20 mt-20 border-t border-white/20 pt-20">
         {page.sections.map((section, i) => (
           <div key={section.title} className="flex flex-col gap-8">
             <div className="flex items-center gap-4">
                <span className="text-4xl font-black opacity-10">0{i+1}</span>
                <h3 className="text-mono text-xl tracking-widest font-bold">{section.title}</h3>
             </div>
             <p className="text-lg opacity-60 leading-relaxed font-sans font-medium whitespace-pre-line">
               {section.body}
             </p>
           </div>
         ))}
      </div>

      {/* Contact Section: Industrial Minimal */}
      <div className="mt-32 p-12 border-2 border-white bg-white/5 backdrop-blur-xl flex flex-col md:flex-row justify-between items-start gap-12">
         <div className="flex flex-col gap-4">
            <span className="text-mono opacity-40">COMMUNICATION_PROTOCOL</span>
            <ul className="flex flex-col gap-4">
              {page.contact.map((entry) => (
                <li key={entry.label} className="flex flex-col gap-1">
                  <span className="text-[10px] text-mono opacity-40 font-bold">{entry.label}</span>
                  {entry.href ? (
                    <a href={entry.href} target="_blank" className="text-3xl font-black hover:italic transition-all">
                      {entry.value}
                    </a>
                  ) : (
                    <span className="text-3xl font-black">{entry.value}</span>
                  )}
                </li>
              ))}
            </ul>
         </div>
         <div className="text-right flex flex-col gap-4">
            <span className="text-mono opacity-40">STATUS_SYSTEM</span>
            <div className="text-xs font-mono font-bold leading-loose flex flex-col items-end">
               <span>&gt; CONNECTION: STABLE</span>
               <span>&gt; BANDWIDTH: UNLIMITED</span>
               <span>&gt; BUFFER: OK</span>
            </div>
         </div>
      </div>
    </div>
  );
}

function CardsPage({ page, signalId }: { page: SignalCardsPage; signalId: string }) {
  return (
    <div className="flex flex-col gap-32 py-20 px-4 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {page.cards.map((card, index) => (
          <div key={card.id} className="w-full">
            <SignalCard
              card={card}
              href={`/signals/${signalId}/${card.id}`}
              index={index}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ZineViewer({ signal, clarity }: ZineViewerProps) {
  return (
    <div className="relative w-full h-full">
      {signal.page.type === 'profile' ? (
        <ProfilePage page={signal.page} />
      ) : signal.page.type === 'cards' && signal.page.renderMode === 'single' ? (
        <ProjectSinglePage cards={signal.page.cards} signalId={signal.id} />
      ) : signal.page.type === 'cards' ? (
        <CardsPage page={signal.page} signalId={signal.id} />
      ) : null}
    </div>
  );
}
