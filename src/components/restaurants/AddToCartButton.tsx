'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

type Props = {
  itemId: string;
  disabled?: boolean;
  available?: number;
};

export default function AddToCartButton({ itemId, disabled, available }: Props) {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [left, setLeft] = useState<number | null>(typeof available === 'number' ? available : null);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, []);

  const showTemp = useCallback((text: string) => {
    setMsg(text);
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setMsg(null), 1500);
  }, []);

  const onClick = useCallback(async () => {
    if (disabled || loading) return;
    if (left !== null && left <= 0) return;
    setLoading(true);
    try {
      const res = await fetch('/api/checkout/add', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          accept: 'application/json',
        },
        body: JSON.stringify({ itemId }),
      });
      if (!res.ok) {
        // parse and map API error
        let code: 'soldout' | 'expired' | 'notfound' | 'unauth' | 'error' = 'error';
        try {
          const data = (await res.json()) as any;
          const msg: string = typeof data?.error === 'string' ? data.error.toLowerCase() : '';
          if (msg.includes('sold out')) code = 'soldout';
          else if (msg.includes('expired')) code = 'expired';
          else if (msg.includes('not found')) code = 'notfound';
          else if (msg.includes('unauthorized')) code = 'unauth';
        } catch {}
        if (code === 'error') {
          if (res.status === 401) code = 'unauth';
          else if (res.status === 404) code = 'notfound';
          else if (res.status === 409) code = 'soldout';
        }
        if (code === 'soldout') showTemp('Sold out');
        else if (code === 'expired') showTemp('Expired');
        else if (code === 'notfound') showTemp('Not available');
        else if (code === 'unauth') showTemp('Sign in required');
        else showTemp('Error');
        return;
      }
      showTemp('Added');
      // Optimistically lower local available and notify others on page
      try {
        window.dispatchEvent(
          new CustomEvent('checkout:item-delta', { detail: { itemId, delta: -1 } }),
        );
      } catch {}
      if (left !== null) setLeft(Math.max(0, left - 1));
      // Refresh count and notify navbar for immediate update
      try {
        const c = await fetch('/api/checkout/count', { cache: 'no-store' });
        const data = (await c.json()) as { count?: number };
        window.dispatchEvent(
          new CustomEvent('checkout:count', { detail: { count: data.count ?? 0 } }),
        );
      } catch {}
    } finally {
      setLoading(false);
    }
  }, [itemId, disabled, loading, left, showTemp]);

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        className="rounded border px-2 py-1 text-xs hover:bg-gray-50 disabled:opacity-50"
        aria-label="Add to cart"
        onClick={onClick}
        disabled={!!disabled || loading || (left !== null && left <= 0)}
      >
        {loading ? 'Adding…' : 'Add to cart'}
      </button>
      <span aria-live="polite" className="text-xs text-gray-600">
        {msg}
      </span>
    </div>
  );
}
