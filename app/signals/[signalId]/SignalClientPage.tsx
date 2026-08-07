import type { Signal } from '@/types/scanner';
import AboutArchive from '@/components/pages/AboutArchive';
import ProjectsStage from '@/components/pages/ProjectsStage';
import CanonField from '@/components/pages/CanonField';
import MediaMatrix from '@/components/pages/MediaMatrix';
import JournalIndex from '@/components/pages/JournalIndex';

export default function SignalClientPage({ signal, signalId }: { signal: Signal; signalId: string }) {
  const { page } = signal;

  return (
    <>
      {page.type === 'profile' && <AboutArchive page={page} />}
      {page.type === 'influences' && <CanonField page={page} title={signal.title} />}
      {page.type === 'list' && signalId === 'listening' && <MediaMatrix page={page} title={signal.title} />}
      {page.type === 'cards' && signalId === 'journal' && <JournalIndex page={page} signalId={signalId} title={signal.title} />}
      {page.type === 'cards' && signalId === 'projects' && <ProjectsStage page={page} signalId={signalId} title={signal.title} />}
    </>
  );
}
