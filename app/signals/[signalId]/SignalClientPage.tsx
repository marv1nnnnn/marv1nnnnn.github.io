'use client';

import { useEffect } from 'react';
import type { Signal } from '@/types/scanner';
import AboutArchive from '@/components/pages/AboutArchive';
import ProjectsStage from '@/components/pages/ProjectsStage';
import CanonField from '@/components/pages/CanonField';
import MediaMatrix from '@/components/pages/MediaMatrix';
import JournalIndex from '@/components/pages/JournalIndex';

export default function SignalClientPage({ signal, signalId }: { signal: Signal; signalId: string }) {
  const { page } = signal;

  useEffect(() => {
    document.body.className = `antialiased theme-${signalId}`;
    return () => { document.body.className = 'antialiased'; };
  }, [signalId]);

  return (
    <>
      {page.type === 'profile' && <AboutArchive page={page} />}
      {page.type === 'influences' && <CanonField page={page} />}
      {page.type === 'list' && signalId === 'listening' && <MediaMatrix page={page} />}
      {page.type === 'cards' && signalId === 'journal' && <JournalIndex page={page} signalId={signalId} />}
      {page.type === 'cards' && signalId === 'projects' && <ProjectsStage page={page} signalId={signalId} />}
    </>
  );
}
