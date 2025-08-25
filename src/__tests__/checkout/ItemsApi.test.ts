import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/auth', () => ({ auth: vi.fn() }));
vi.mock('@/lib/db', () => ({
  prisma: {
    $transaction: (fn: any) =>
      fn({
        checkout: { findFirst: vi.fn(), update: vi.fn() },
        order: { findFirst: vi.fn(), update: vi.fn() },
        orderItem: { findUnique: vi.fn(), update: vi.fn(), delete: vi.fn() },
        item: { findUnique: vi.fn(), updateMany: vi.fn(), update: vi.fn() },
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

describe('Checkout items API', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it('401 when unauthenticated (PATCH)', async () => {
    const { auth } = await getMocks();
    auth.mockResolvedValue(null);
    const mod = await import('@/app/api/checkout/items/route');
    const res = await mod.PATCH(new Request('http://x/api/checkout/items', { method: 'PATCH' }));
    expect(res.status).toBe(401);
  });

  it('400 when missing data (PATCH)', async () => {
    const { auth } = await getMocks();
    auth.mockResolvedValue({ user: { id: 'u1' } });
    const mod = await import('@/app/api/checkout/items/route');
    const res = await mod.PATCH(
      new Request('http://x/api/checkout/items', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: '{}',
      }),
    );
    expect(res.status).toBe(400);
  });

  it('returns 409 when incrementing expired or sold out', async () => {
    const { auth } = await getMocks();
    auth.mockResolvedValue({ user: { id: 'u1' } });
    // Override transaction with minimal behavior chain for expired
    const dbMod = await import('@/lib/db');
    (dbMod as any).prisma.$transaction = (fn: any) =>
      fn({
        checkout: { findFirst: vi.fn().mockResolvedValue({ id: 'c1' }), update: vi.fn() },
        order: { findFirst: vi.fn().mockResolvedValue({ id: 'o1' }), update: vi.fn() },
        orderItem: {
          findUnique: vi.fn().mockResolvedValue({ quantity: 1, priceCentsAtPurchase: 100 }),
        },
        item: {
          findUnique: vi.fn().mockResolvedValue({
            quantityAvailable: 1,
            expiresAt: new Date('2000-01-01T00:00:00Z'),
          }),
          updateMany: vi.fn(),
          update: vi.fn(),
        },
      });

    const mod = await import('@/app/api/checkout/items/route');
    const res = await mod.PATCH(
      new Request('http://x/api/checkout/items', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ itemId: 'i1', delta: 1 }),
      }),
    );
    expect(res.status).toBe(409);
  });

  it('200 on increment success (PATCH)', async () => {
    const { auth } = await getMocks();
    auth.mockResolvedValue({ user: { id: 'u1' } });
    const dbMod = await import('@/lib/db');
    (dbMod as any).prisma.$transaction = (fn: any) =>
      fn({
        checkout: {
          findFirst: vi.fn().mockResolvedValue({ id: 'c1' }),
          update: vi.fn().mockResolvedValue({ id: 'c1' }),
        },
        order: { findFirst: vi.fn().mockResolvedValue({ id: 'o1' }), update: vi.fn() },
        orderItem: {
          findUnique: vi.fn().mockResolvedValue({ quantity: 1, priceCentsAtPurchase: 250 }),
          update: vi.fn(),
        },
        item: {
          findUnique: vi
            .fn()
            .mockResolvedValue({ quantityAvailable: 2, expiresAt: new Date('2999-01-01') }),
          updateMany: vi.fn().mockResolvedValue({ count: 1 }),
          update: vi.fn(),
        },
      });
    const mod = await import('@/app/api/checkout/items/route');
    const res = await mod.PATCH(
      new Request('http://x/api/checkout/items', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ itemId: 'i1', delta: 1 }),
      }),
    );
    expect(res.status).toBe(200);
  });

  it('200 on decrement success (PATCH)', async () => {
    const { auth } = await getMocks();
    auth.mockResolvedValue({ user: { id: 'u1' } });
    const dbMod = await import('@/lib/db');
    (dbMod as any).prisma.$transaction = (fn: any) =>
      fn({
        checkout: {
          findFirst: vi.fn().mockResolvedValue({ id: 'c1' }),
          update: vi.fn().mockResolvedValue({ id: 'c1' }),
        },
        order: { findFirst: vi.fn().mockResolvedValue({ id: 'o1' }), update: vi.fn() },
        orderItem: {
          findUnique: vi.fn().mockResolvedValue({ quantity: 2, priceCentsAtPurchase: 250 }),
          update: vi.fn(),
          delete: vi.fn(),
        },
        item: { update: vi.fn() },
      });
    const mod = await import('@/app/api/checkout/items/route');
    const res = await mod.PATCH(
      new Request('http://x/api/checkout/items', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ itemId: 'i1', delta: -1 }),
      }),
    );
    expect(res.status).toBe(200);
  });

  it('200 on remove (DELETE)', async () => {
    const { auth } = await getMocks();
    auth.mockResolvedValue({ user: { id: 'u1' } });
    const dbMod = await import('@/lib/db');
    (dbMod as any).prisma.$transaction = (fn: any) =>
      fn({
        checkout: {
          findFirst: vi.fn().mockResolvedValue({ id: 'c1' }),
          update: vi.fn().mockResolvedValue({ id: 'c1' }),
        },
        order: { findFirst: vi.fn().mockResolvedValue({ id: 'o1' }), update: vi.fn() },
        orderItem: {
          findUnique: vi.fn().mockResolvedValue({ quantity: 2, priceCentsAtPurchase: 250 }),
          delete: vi.fn(),
        },
        item: { update: vi.fn() },
      });
    const mod = await import('@/app/api/checkout/items/route');
    const res = await mod.DELETE(new Request('http://x/api/checkout/items?itemId=i1'));
    expect(res.status).toBe(200);
  });

  it('POST form returns 303 redirect to checkout on success', async () => {
    const { auth } = await getMocks();
    auth.mockResolvedValue({ user: { id: 'u1' } });
    const dbMod = await import('@/lib/db');
    (dbMod as any).prisma.$transaction = (fn: any) =>
      fn({
        checkout: { findFirst: vi.fn().mockResolvedValue({ id: 'c1' }), update: vi.fn() },
        order: { findFirst: vi.fn().mockResolvedValue({ id: 'o1' }), update: vi.fn() },
        orderItem: {
          findUnique: vi.fn().mockResolvedValue({ quantity: 1, priceCentsAtPurchase: 100 }),
          update: vi.fn(),
        },
        item: {
          findUnique: vi
            .fn()
            .mockResolvedValue({ quantityAvailable: 5, expiresAt: new Date('2999-01-01') }),
          updateMany: vi.fn().mockResolvedValue({ count: 1 }),
        },
      });
    const mod = await import('@/app/api/checkout/items/route');
    const form = 'itemId=i1&op=inc';
    const res = await mod.POST(
      new Request('http://x/api/checkout/items', {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body: form,
      }),
    );
    expect(res.status).toBe(303);
  });

  it('decrement deletes when quantity is 1', async () => {
    const { auth } = await getMocks();
    auth.mockResolvedValue({ user: { id: 'u1' } });
    const dbMod = await import('@/lib/db');
    (dbMod as any).prisma.$transaction = (fn: any) =>
      fn({
        checkout: {
          findFirst: vi.fn().mockResolvedValue({ id: 'c1' }),
          update: vi.fn().mockResolvedValue({ id: 'c1' }),
        },
        order: { findFirst: vi.fn().mockResolvedValue({ id: 'o1' }), update: vi.fn() },
        orderItem: {
          findUnique: vi.fn().mockResolvedValue({ quantity: 1, priceCentsAtPurchase: 250 }),
          update: vi.fn(),
          delete: vi.fn(),
        },
        item: { update: vi.fn() },
      });
    const mod = await import('@/app/api/checkout/items/route');
    const res = await mod.PATCH(
      new Request('http://x/api/checkout/items', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ itemId: 'i1', delta: -1 }),
      }),
    );
    expect(res.status).toBe(200);
  });

  it('increment soldout returns 409', async () => {
    const { auth } = await getMocks();
    auth.mockResolvedValue({ user: { id: 'u1' } });
    const dbMod = await import('@/lib/db');
    (dbMod as any).prisma.$transaction = (fn: any) =>
      fn({
        checkout: { findFirst: vi.fn().mockResolvedValue({ id: 'c1' }) },
        order: { findFirst: vi.fn().mockResolvedValue({ id: 'o1' }) },
        orderItem: {
          findUnique: vi.fn().mockResolvedValue({ quantity: 1, priceCentsAtPurchase: 100 }),
        },
        item: {
          findUnique: vi
            .fn()
            .mockResolvedValue({ quantityAvailable: 0, expiresAt: new Date('2999-01-01') }),
          updateMany: vi.fn().mockResolvedValue({ count: 0 }),
        },
      });
    const mod = await import('@/app/api/checkout/items/route');
    const res = await mod.PATCH(
      new Request('http://x/api/checkout/items', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ itemId: 'i1', delta: 1 }),
      }),
    );
    expect(res.status).toBe(409);
  });

  it('POST HTML soldout maps to ?error=soldout', async () => {
    const { auth } = await getMocks();
    auth.mockResolvedValue({ user: { id: 'u1' } });
    const dbMod = await import('@/lib/db');
    (dbMod as any).prisma.$transaction = (fn: any) =>
      fn({
        checkout: { findFirst: vi.fn().mockResolvedValue({ id: 'c1' }), update: vi.fn() },
        order: { findFirst: vi.fn().mockResolvedValue({ id: 'o1' }) },
        orderItem: {
          findUnique: vi.fn().mockResolvedValue({ quantity: 1, priceCentsAtPurchase: 100 }),
        },
        item: {
          findUnique: vi
            .fn()
            .mockResolvedValue({ quantityAvailable: 0, expiresAt: new Date('2999-01-01') }),
          updateMany: vi.fn().mockResolvedValue({ count: 0 }),
        },
      });
    const mod = await import('@/app/api/checkout/items/route');
    const res = await mod.POST(
      new Request('http://x/app', {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded', accept: 'text/html' },
        body: 'itemId=i1&op=inc',
      }),
    );
    expect(res.status).toBe(303);
    expect(res.headers.get('location')).toContain('/checkout');
    expect(res.headers.get('location')).toContain('error=soldout');
  });

  it('DELETE 400 when missing itemId', async () => {
    const { auth } = await getMocks();
    auth.mockResolvedValue({ user: { id: 'u1' } });
    const mod = await import('@/app/api/checkout/items/route');
    const res = await mod.DELETE(new Request('http://x/api/checkout/items'));
    expect(res.status).toBe(400);
  });

  it('PATCH 404 when no pending checkout', async () => {
    const { auth } = await getMocks();
    auth.mockResolvedValue({ user: { id: 'u1' } });
    const dbMod = await import('@/lib/db');
    (dbMod as any).prisma.$transaction = (fn: any) =>
      fn({
        checkout: { findFirst: vi.fn().mockResolvedValue(null) },
      });
    const mod = await import('@/app/api/checkout/items/route');
    const res = await mod.PATCH(
      new Request('http://x/api/checkout/items', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ itemId: 'i1', delta: 1 }),
      }),
    );
    expect(res.status).toBe(404);
  });

  it('PATCH 404 when item not in checkout', async () => {
    const { auth } = await getMocks();
    auth.mockResolvedValue({ user: { id: 'u1' } });
    const dbMod = await import('@/lib/db');
    (dbMod as any).prisma.$transaction = (fn: any) =>
      fn({
        checkout: { findFirst: vi.fn().mockResolvedValue({ id: 'c1' }) },
        order: { findFirst: vi.fn().mockResolvedValue(null) },
      });
    const mod = await import('@/app/api/checkout/items/route');
    const res = await mod.PATCH(
      new Request('http://x/api/checkout/items', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ itemId: 'i1', delta: 1 }),
      }),
    );
    expect(res.status).toBe(404);
  });

  it('PATCH 400 when delta is 0', async () => {
    const { auth } = await getMocks();
    auth.mockResolvedValue({ user: { id: 'u1' } });
    const mod = await import('@/app/api/checkout/items/route');
    const res = await mod.PATCH(
      new Request('http://x/api/checkout/items', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ itemId: 'i1', delta: 0 }),
      }),
    );
    expect(res.status).toBe(400);
  });

  it('POST unauth with HTML redirects to /checkout?error=unauth', async () => {
    const { auth } = await getMocks();
    auth.mockResolvedValue(null);
    const mod = await import('@/app/api/checkout/items/route');
    const res = await mod.POST(
      new Request('http://x/app', {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded', accept: 'text/html' },
        body: 'itemId=i1&op=inc',
      }),
    );
    expect(res.status).toBe(303);
    expect(res.headers.get('location')).toContain('/checkout');
    expect(res.headers.get('location')).toContain('error=unauth');
  });

  it('POST missing op maps to ?error=missing', async () => {
    const { auth } = await getMocks();
    auth.mockResolvedValue({ user: { id: 'u1' } });
    const mod = await import('@/app/api/checkout/items/route');
    const res = await mod.POST(
      new Request('http://x/app', {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded', accept: 'text/html' },
        body: 'itemId=i1',
      }),
    );
    expect(res.status).toBe(303);
    expect(res.headers.get('location')).toContain('error=missing');
  });

  it('DELETE 401 when unauthenticated', async () => {
    const { auth } = await getMocks();
    auth.mockResolvedValue(null);
    const mod = await import('@/app/api/checkout/items/route');
    const res = await mod.DELETE(new Request('http://x/api/checkout/items?itemId=i1'));
    expect(res.status).toBe(401);
  });
});
