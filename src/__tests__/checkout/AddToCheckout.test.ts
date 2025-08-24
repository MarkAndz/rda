import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/auth', () => ({ auth: vi.fn() }));
vi.mock('@/lib/db', () => ({
  prisma: {
    $transaction: (fn: any) =>
      fn({
        item: { findUnique: vi.fn(), updateMany: vi.fn() },
        checkout: { findFirst: vi.fn(), create: vi.fn(), update: vi.fn() },
        order: { findFirst: vi.fn(), create: vi.fn(), update: vi.fn() },
        orderItem: { upsert: vi.fn() },
      }),
  },
}));

async function getMocks() {
  const authMod = await import('@/auth');
  const dbMod = await import('@/lib/db');
  return {
    auth: vi.mocked((authMod as any).auth),
    prisma: (dbMod as any).prisma,
  };
}

describe('Add to checkout API', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it('401 when unauthenticated', async () => {
    const { auth } = await getMocks();
    auth.mockResolvedValue(null);
    const mod = await import('@/app/api/checkout/add/route');
    const res = await mod.POST(new Request('http://x/api/checkout/add', { method: 'POST' }));
    expect(res.status).toBe(401);
  });

  it('400 when itemId missing', async () => {
    const { auth } = await getMocks();
    auth.mockResolvedValue({ user: { id: 'u1' } });
    const mod = await import('@/app/api/checkout/add/route');
    const res = await mod.POST(
      new Request('http://x/api/checkout/add', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: '{}',
      }),
    );
    expect(res.status).toBe(400);
  });

  it('404 when item not found', async () => {
    const { auth, prisma } = await getMocks();
    auth.mockResolvedValue({ user: { id: 'u1' } });
    prisma.$transaction = (fn: any) =>
      fn({
        item: { findUnique: vi.fn().mockResolvedValue(null), updateMany: vi.fn() },
      });
    const mod = await import('@/app/api/checkout/add/route');
    const res = await mod.POST(
      new Request('http://x/api/checkout/add', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ itemId: 'i1' }),
      }),
    );
    expect(res.status).toBe(404);
  });

  it('409 when item expired', async () => {
    const { auth, prisma } = await getMocks();
    auth.mockResolvedValue({ user: { id: 'u1' } });
    prisma.$transaction = (fn: any) =>
      fn({
        item: {
          findUnique: vi.fn().mockResolvedValue({
            id: 'i1',
            name: 'Test',
            restaurantId: 'r1',
            discountedPriceCents: 100,
            expiresAt: new Date('2000-01-01T00:00:00Z'),
            quantityAvailable: 1,
          }),
          updateMany: vi.fn(),
        },
      });
    const mod = await import('@/app/api/checkout/add/route');
    const res = await mod.POST(
      new Request('http://x/api/checkout/add', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ itemId: 'i1' }),
      }),
    );
    expect(res.status).toBe(409);
    const json = await res.json();
    expect(json.error).toBe('Item expired');
  });

  it('409 when item sold out', async () => {
    const { auth, prisma } = await getMocks();
    auth.mockResolvedValue({ user: { id: 'u1' } });
    const updateMany = vi.fn().mockResolvedValue({ count: 0 });
    prisma.$transaction = (fn: any) =>
      fn({
        item: {
          findUnique: vi.fn().mockResolvedValue({
            id: 'i1',
            name: 'Test',
            restaurantId: 'r1',
            discountedPriceCents: 100,
            expiresAt: new Date('2099-01-01T00:00:00Z'),
            quantityAvailable: 0,
          }),
          updateMany,
        },
      });
    const mod = await import('@/app/api/checkout/add/route');
    const res = await mod.POST(
      new Request('http://x/api/checkout/add', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ itemId: 'i1' }),
      }),
    );
    expect(res.status).toBe(409);
    const json = await res.json();
    expect(json.error).toBe('Item sold out');
  });
});
