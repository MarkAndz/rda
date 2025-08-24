import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

vi.mock('@/auth', () => ({
  auth: vi.fn(),
}));

vi.mock('@/lib/db', () => ({
  prisma: {
    order: {
      findUnique: vi.fn(),
    },
  },
}));

async function getMocks() {
  const authMod = await import('@/auth');
  const dbMod = await import('@/lib/db');
  return {
    auth: vi.mocked((authMod as unknown as { auth: unknown }).auth as ReturnType<typeof vi.fn>),
    prisma: (dbMod as unknown as { prisma: unknown }).prisma as {
      order: { findUnique: ReturnType<typeof vi.fn> };
    },
  };
}

function makeOrder(overrides?: any) {
  return {
    id: 'ord_aaaaaaaa',
    createdAt: new Date('2024-01-02T10:00:00Z'),
    status: 'COMPLETED',
    totalCents: 2599,
    restaurant: { id: 'r1', name: 'Test Resto' },
    user: { id: 'user-1' },
    items: [
      { quantity: 1, priceCentsAtPurchase: 1599, item: { id: 'i1', name: 'Burger' } },
      { quantity: 1, priceCentsAtPurchase: 1000, item: { id: 'i2', name: 'Fries' } },
    ],
    checkout: {
      id: 'chk_123',
      createdAt: new Date('2024-01-02T10:00:10Z'),
      subtotalCents: 2599,
      taxCents: 0,
      feeCents: 0,
      totalCents: 2599,
    },
    ...overrides,
  };
}

describe('OrderDetailsPage', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it('renders details for a user-owned order', async () => {
    const { auth, prisma } = await getMocks();
    auth.mockResolvedValue({ user: { id: 'user-1' } });
    prisma.order.findUnique.mockResolvedValue(makeOrder());

    const { default: Page } = await import('@/app/profile/orders/[id]/page');
    const el = await Page({ params: { id: 'ord_aaaaaaaa' } });
    const html = renderToStaticMarkup(el as unknown as React.ReactElement);

    expect(html).toContain('Order #ord_aaaa');
    expect(html).toContain('Test Resto');
    expect(html).toContain('€25.99');
    expect(html).toContain('Payment session');
  });

  it('404s when order not found or not owned', async () => {
    const { auth, prisma } = await getMocks();
    auth.mockResolvedValue({ user: { id: 'user-1' } });
    prisma.order.findUnique.mockResolvedValue({ ...makeOrder(), user: { id: 'other' } });

    const { default: Page } = await import('@/app/profile/orders/[id]/page');

    let threw = false;
    try {
      await Page({ params: { id: 'ord_aaaaaaaa' } });
    } catch (e) {
      threw = true;
    }
    expect(threw).toBe(true);
  });

  it('renders without checkout gracefully', async () => {
    const { auth, prisma } = await getMocks();
    auth.mockResolvedValue({ user: { id: 'user-1' } });
    prisma.order.findUnique.mockResolvedValue(makeOrder({ checkout: null }));

    const { default: Page } = await import('@/app/profile/orders/[id]/page');
    const el = await Page({ params: { id: 'ord_aaaaaaaa' } });
    const html = renderToStaticMarkup(el as unknown as React.ReactElement);

    expect(html).toContain('No payment information');
  });
});
