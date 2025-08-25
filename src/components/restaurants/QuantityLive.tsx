'use client';

import { useEffect, useState } from 'react';

type Props = { itemId: string; initial: number };

export default function QuantityLive({ itemId, initial }: Props) {
  const [qty, setQty] = useState(initial);

  useEffect(() => {
    const onDelta = (e: Event) => {
      const detail = (e as CustomEvent).detail as { itemId?: string; delta?: number };
      if (detail?.itemId === itemId && typeof detail.delta === 'number') {
        const d = detail.delta as number;
        setQty((q) => Math.max(0, q + d));
      }
    };
    window.addEventListener('checkout:item-delta', onDelta as EventListener);
    return () => window.removeEventListener('checkout:item-delta', onDelta as EventListener);
  }, [itemId]);

  return <span data-testid={`qty-${itemId}`}>{qty}</span>;
}
