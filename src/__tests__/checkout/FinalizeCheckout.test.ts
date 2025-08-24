import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/auth', () => ({ auth: vi.fn() }));
vi.mock('@/lib/db', () => ({
  prisma: {
    $transaction: (fn: any) =>
      fn({
        checkout: { findFirst: vi.fn(), update: vi.fn() },
        order: { updateMany: vi.fn() },
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

describe('Finalize checkout API', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it('401 when unauthenticated', async () => {
    const { auth } = await getMocks();
    auth.mockResolvedValue(null);
    const mod = await import('@/app/api/checkout/finalize/route');
    const res = await mod.POST(new Request('http://x/api/checkout/finalize', { method: 'POST' }));
    expect(res.status).toBe(401);
  });

  it('400 when checkoutId missing', async () => {
    const { auth } = await getMocks();
    auth.mockResolvedValue({ user: { id: 'u1' } });
    const mod = await import('@/app/api/checkout/finalize/route');
    const res = await mod.POST(
      new Request('http://x/api/checkout/finalize', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: '{}',
      }),
    );
    expect(res.status).toBe(400);
  });

  it('409 when checkout not pending or not owned', async () => {
    const { auth, prisma } = await getMocks();
    auth.mockResolvedValue({ user: { id: 'u1' } });
    prisma.$transaction = (fn: any) =>
      fn({
        checkout: { findFirst: vi.fn().mockResolvedValue(null), update: vi.fn() },
        order: { updateMany: vi.fn() },
      });
    const mod = await import('@/app/api/checkout/finalize/route');
    const res = await mod.POST(
      new Request('http://x/api/checkout/finalize', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ checkoutId: 'c1' }),
      }),
    );
    expect(res.status).toBe(409);
  });

  it('200 and redirectUrl on success', async () => {
    const { auth, prisma } = await getMocks();
    auth.mockResolvedValue({ user: { id: 'u1' } });
    const updateMany = vi.fn();
    const update = vi.fn();
    prisma.$transaction = (fn: any) =>
      fn({
        checkout: { findFirst: vi.fn().mockResolvedValue({ id: 'c1' }), update },
        order: { updateMany },
      });
    const mod = await import('@/app/api/checkout/finalize/route');
    const res = await mod.POST(
      new Request('http://x/api/checkout/finalize', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ checkoutId: 'c1' }),
      }),
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.redirectUrl).toBe('/profile');
  });
});
