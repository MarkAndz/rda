'use client';

import { signIn, signOut, useSession } from 'next-auth/react';
import Link from 'next/link';
import { useState } from 'react';

export function AuthButton() {
  const { data: session, status } = useSession();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const toggleDropdown = () => setIsDropdownOpen(!isDropdownOpen);
  const closeDropdown = () => setIsDropdownOpen(false);

  if (status === 'loading') {
    return (
      <div data-testid="auth-loading" className="h-8 w-20 animate-pulse rounded bg-gray-200"></div>
    );
  }

  if (session?.user) {
    return (
      <div className="relative">
        <button
          data-testid="user-menu-button"
          onClick={toggleDropdown}
          className="flex items-center space-x-2 focus:outline-none"
        >
          {session.user.image ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={session.user.image}
                alt={session.user.name || 'User'}
                className="h-8 w-8 rounded-full"
              />
            </>
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-500 font-medium text-white">
              {session.user.name?.[0] || 'U'}
            </div>
          )}
          <span className="hidden md:block">{session.user.name}</span>
        </button>

        {isDropdownOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={closeDropdown}></div>
            <div
              data-testid="user-dropdown-menu"
              className="absolute right-0 z-20 mt-2 w-48 rounded-md bg-white py-1 shadow-lg"
            >
              <Link
                href="/profile"
                data-testid="profile-link"
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                onClick={closeDropdown}
              >
                Profile
              </Link>
              <Link
                href="/dashboard"
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                onClick={closeDropdown}
              >
                Dashboard
              </Link>
              <button
                data-testid="sign-out-button"
                onClick={() => signOut({ callbackUrl: '/' })}
                className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
              >
                Sign out
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <button
      data-testid="sign-in-button"
      onClick={() => signIn()}
      className="rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
    >
      Sign in
    </button>
  );
}
