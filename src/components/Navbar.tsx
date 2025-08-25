'use client';

import Link from 'next/link';
import { AuthButton } from './auth/AuthButton';
import { useEffect, useState } from 'react';

function useCheckoutCount() {
  const [count, setCount] = useState<number>(0);
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch('/api/checkout/count', { cache: 'no-store' });
        if (!res.ok) return;
        const data = (await res.json()) as { count?: number };
        if (!cancelled) setCount(data.count ?? 0);
      } catch {}
    }
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { count?: number };
      if (typeof detail?.count === 'number') setCount(detail.count);
    };
    load();
    const id = setInterval(load, 10_000);
    window.addEventListener('checkout:count', handler as EventListener);
    return () => {
      cancelled = true;
      clearInterval(id);
      window.removeEventListener('checkout:count', handler as EventListener);
    };
  }, []);
  return count;
}

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const checkoutCount = useCheckoutCount();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav className="bg-white shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between">
          <div className="flex items-center">
            <Link href="/" className="text-xl font-bold text-blue-600">
              RDA
            </Link>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-4">
              <Link
                href="/"
                className="px-3 py-2 text-sm font-medium text-gray-900 hover:text-blue-600"
              >
                Home
              </Link>
              <Link
                href="/restaurants"
                className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-blue-600"
              >
                Restaurants
              </Link>
              <Link
                href="/about"
                className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-blue-600"
              >
                About
              </Link>
            </div>
          </div>

          <div className="flex items-center">
            <div className="hidden sm:ml-6 sm:flex sm:items-center">
              <Link href="/checkout" className="relative mr-3 text-sm text-gray-700">
                Checkout
                {checkoutCount > 0 && (
                  <span className="absolute -top-2 -right-3 rounded-full bg-blue-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                    {checkoutCount}
                  </span>
                )}
              </Link>
              <AuthButton />
            </div>

            {/* Mobile menu button */}
            <div className="flex items-center sm:hidden">
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500 focus:ring-2 focus:ring-blue-500 focus:outline-none focus:ring-inset"
                onClick={toggleMenu}
              >
                <span className="sr-only">Open main menu</span>
                <svg
                  className={`${isMenuOpen ? 'hidden' : 'block'} h-6 w-6`}
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
                <svg
                  className={`${isMenuOpen ? 'block' : 'hidden'} h-6 w-6`}
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className={`${isMenuOpen ? 'block' : 'hidden'} sm:hidden`}>
        <div className="space-y-1 pt-2 pb-3">
          <Link
            href="/"
            className="block px-3 py-2 text-base font-medium text-gray-900 hover:bg-gray-50"
          >
            Home
          </Link>
          <Link
            href="/restaurants"
            className="block px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50"
          >
            Restaurants
          </Link>
          <Link
            href="/about"
            className="block px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50"
          >
            About
          </Link>
        </div>
        <div className="border-t border-gray-200 pt-4 pb-3">
          <div className="px-3">
            <Link href="/checkout" className="relative mb-2 block text-sm text-gray-700">
              Checkout
              {checkoutCount > 0 && (
                <span className="ml-2 rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-semibold text-white">
                  {checkoutCount}
                </span>
              )}
            </Link>
            <AuthButton />
          </div>
        </div>
      </div>
    </nav>
  );
}
