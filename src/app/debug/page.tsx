'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';

export default function DebugSessionPage() {
  const { data: session, status } = useSession();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="mx-auto max-w-4xl p-8">Loading...</div>;
  }

  return (
    <div className="mx-auto max-w-4xl p-8">
      <h1 className="mb-6 text-2xl font-bold">Session Debug</h1>

      <div className="mb-6 rounded-lg bg-white p-6 shadow">
        <h2 className="mb-2 text-lg font-medium">Session Status</h2>
        <div className="mb-4 rounded bg-gray-100 p-2">
          <code>{status}</code>
        </div>

        <h2 className="mb-2 text-lg font-medium">Session Data</h2>
        <pre className="max-h-96 overflow-auto rounded bg-gray-100 p-2">
          {JSON.stringify(session, null, 2)}
        </pre>
      </div>

      <div className="rounded-lg bg-white p-6 shadow">
        <h2 className="mb-2 text-lg font-medium">Environment Check</h2>
        <ul className="list-disc pl-5">
          <li>
            NEXTAUTH_URL:{' '}
            {typeof window !== 'undefined' && (process.env.NEXT_PUBLIC_NEXTAUTH_URL || 'Not set')}
          </li>
          <li>
            Auth Providers:{' '}
            {typeof window !== 'undefined' && session
              ? 'Available'
              : 'Not available or not authenticated'}
          </li>
        </ul>
      </div>
    </div>
  );
}
