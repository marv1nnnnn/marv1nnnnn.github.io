import type { Metadata } from 'next';
import Link from 'next/link';
import { TapeScene } from '@/components/tape/parts';
import Booklet from '@/components/tape/Booklet';
import Photos from '@/components/tape/Photos';
import { getCanon } from '@/lib/tape';

export const metadata: Metadata = {
  title: 'input',
  description: 'Fourteen works that stayed with Marvin Ma.',
  alternates: { canonical: '/input' },
};

export default function InputPage() {
  const canon = getCanon();
  return (
    <Booklet path="/input" title="input" lede="Fourteen things that stayed with me. These don’t wear." className="input">
      <TapeScene seed="input" age={0.1} />
      <h2><span>stayed with me</span></h2>
      <Photos records={canon} />
      <Link href="/log" className="to-log">everything else, as it comes in → log</Link>
    </Booklet>
  );
}
