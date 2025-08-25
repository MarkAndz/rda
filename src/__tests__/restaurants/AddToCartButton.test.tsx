import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import AddToCartButton from '@/components/restaurants/AddToCartButton';

describe('AddToCartButton', () => {
  const originalFetch = global.fetch;
  beforeEach(() => {
    global.fetch = vi.fn();
  });
  afterEach(() => {
    global.fetch = originalFetch as any;
  });

  it('adds to cart without redirect and emits count', async () => {
    (global.fetch as any)
      .mockResolvedValueOnce(new Response(JSON.stringify({ ok: true }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ count: 3 }), { status: 200 }));
    const spy = vi.fn();
    window.addEventListener('checkout:count', spy as EventListener);
    render(<AddToCartButton itemId="i1" />);
    fireEvent.click(screen.getByRole('button', { name: /add to cart/i }));
    await waitFor(() => expect(spy).toHaveBeenCalled());
    expect(screen.getByText(/added/i)).toBeInTheDocument();
  });

  it('shows error message on soldout', async () => {
    (global.fetch as any).mockResolvedValueOnce(
      new Response(JSON.stringify({ error: 'soldout' }), { status: 409 }) as any,
    );
    render(<AddToCartButton itemId="i1" />);
    fireEvent.click(screen.getByRole('button', { name: /add to cart/i }));
    await waitFor(() => expect(screen.getByText(/sold out/i)).toBeInTheDocument());
  });
});
