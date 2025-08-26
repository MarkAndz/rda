'use client';

import dynamic from 'next/dynamic';

// Client-only wrapper to avoid SSR rendering of time-based UI (prevents hydration drift)
const CountdownNoSSR = dynamic(() => import('./Countdown'), { ssr: false });

export default CountdownNoSSR;
