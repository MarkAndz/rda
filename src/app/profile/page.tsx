'use client';

import { useSession, signIn } from 'next-auth/react';
import { useState, useEffect } from 'react';

export default function Profile() {
  const { data: session, status } = useSession();
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  // Handle loading state
  if (status === 'loading' || !isLoaded) {
    return <div className="mx-auto max-w-4xl p-8">Loading...</div>;
  }

  // Handle unauthenticated state
  if (status === 'unauthenticated') {
    return (
      <div className="mx-auto max-w-4xl p-8 text-center">
        <h1 className="mb-6 text-2xl font-bold">Authentication Required</h1>
        <p className="mb-4">You need to be signed in to view your profile.</p>
        <button
          onClick={() => signIn()}
          className="rounded bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
        >
          Sign In
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl p-8">
      <h1 className="mb-6 text-2xl font-bold">Your Profile</h1>

      <div className="rounded-lg bg-white p-6 shadow">
        <div className="mb-6 flex items-center space-x-6">
          {session?.user?.image ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={session.user.image}
                alt={session.user.name || 'User'}
                className="h-24 w-24 rounded-full"
              />
            </>
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gray-200 text-2xl font-bold text-gray-500">
              {session?.user?.name?.[0] || 'U'}
            </div>
          )}

          <div>
            <h2 className="text-xl font-medium">{session?.user?.name || 'User'}</h2>
            <p className="text-gray-600">{session?.user?.email || ''}</p>
          </div>
        </div>

        <div className="border-t pt-4">
          <h3 className="mb-2 font-medium">Connected Accounts</h3>
          <ul className="space-y-2">
            {session?.user?.accounts?.map((account) => (
              <li key={account.provider} className="flex items-center">
                <span className="text-gray-600">{account.provider}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
