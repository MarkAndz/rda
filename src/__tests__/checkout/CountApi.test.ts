import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/auth', () => ({ auth: vi.fn() }));
vi.mock('@/lib/db', () => ({
  prisma: {
    checkout: { findFirst: vi.fn() },
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

describe('Checkout count API', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it('returns 0 when unauthenticated', async () => {
    const { auth } = await getMocks();
    auth.mockResolvedValue(null);
    const mod = await import('@/app/api/checkout/count/route');
    const res = await mod.GET();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.count).toBe(0);
  });

  it('sums quantities for pending checkout', async () => {
    const { auth, prisma } = await getMocks();
    auth.mockResolvedValue({ user: { id: 'u1' } });
    prisma.checkout.findFirst.mockResolvedValue({
      orders: [{ items: [{ quantity: 2 }, { quantity: 1 }] }, { items: [{ quantity: 3 }] }],
    });
    const mod = await import('@/app/api/checkout/count/route');
    const res = await mod.GET();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.count).toBe(6);
  });
});
