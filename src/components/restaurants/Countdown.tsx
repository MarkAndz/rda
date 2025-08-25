'use client';

import { useEffect, useMemo, useState } from 'react';

function format(ms: number) {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(totalSec / 60)
    .toString()
    .padStart(2, '0');
  const s = Math.floor(totalSec % 60)
    .toString()
    .padStart(2, '0');
  return `${m}:${s}`;
}

export default function Countdown({ expiresAt }: { expiresAt: string | Date }) {
  const end = useMemo(() => new Date(expiresAt).getTime(), [expiresAt]);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const remaining = end - now;
  if (remaining <= 0 || remaining > 10 * 60 * 1000) return null;

  return (
    <span className="ml-2 rounded bg-yellow-100 px-1.5 py-0.5 text-[10px] font-medium text-yellow-800">
      Ends in {format(remaining)}
    </span>
  );
}
