'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

// Old /signals/* and /shows URLs moved; static export has no server redirects, so hand off in the page.
export default function Redirect({ to }: { to: string }) {
  const router = useRouter();
  useEffect(() => {
    router.replace(to);
  }, [router, to]);
  return (
    <article className="page">
      <meta httpEquiv="refresh" content={`1; url=${to}`} />
      <p className="lede">This page moved to <Link href={to}>{to}</Link>.</p>
    </article>
  );
}
