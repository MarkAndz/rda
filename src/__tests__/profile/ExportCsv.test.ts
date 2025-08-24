import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/auth', () => ({
  auth: vi.fn(),
}));

vi.mock('@/lib/db', () => ({
  prisma: {
    order: {
      findMany: vi.fn(),
    },
  },
}));

async function getMocks() {
  const authMod = await import('@/auth');
  const dbMod = await import('@/lib/db');
  return {
    auth: vi.mocked((authMod as unknown as { auth: unknown }).auth as ReturnType<typeof vi.fn>),
    prisma: (dbMod as unknown as { prisma: unknown }).prisma as {
      order: { findMany: ReturnType<typeof vi.fn> };
    },
  };
}

describe('Export CSV API', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it('returns 401 when unauthenticated', async () => {
    const { auth } = await getMocks();
    auth.mockResolvedValue(null as any);
    const mod = await import('@/app/api/profile/orders/export.csv/route');
    const res = await mod.GET(new Request('http://localhost/api/profile/orders/export.csv'));
    expect(res.status).toBe(401);
  });

  it('returns CSV with header and rows; respects filters/sort', async () => {
    const { auth, prisma } = await getMocks();
    auth.mockResolvedValue({ user: { id: 'user-1' } } as any);
    const now = new Date('2024-01-02T10:00:00Z');
    prisma.order.findMany.mockResolvedValue([
      {
        id: 'ord_1',
        createdAt: now,
        status: 'COMPLETED',
        totalCents: 2599,
        restaurant: { name: 'Test Resto' },
        _count: { items: 2 },
      },
    ] as any);

    const mod = await import('@/app/api/profile/orders/export.csv/route');
    const res = await mod.GET(
      new Request('http://localhost/api/profile/orders/export.csv?status=COMPLETED&sort=oldest'),
    );

    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('text/csv');
    expect(res.headers.get('content-disposition')).toContain('attachment');
    const text = await res.text();
    const [header, row] = text.trim().split('\n');
    expect(header).toBe('order_id,created_at,status,restaurant,items_count,total_cents,currency');
    expect(row).toContain('ord_1');
    expect(row).toContain('COMPLETED');
    expect(row).toContain('Test Resto');
    expect(row).toContain('2599');
    expect(row).toContain('EUR');

    // Verify prisma called with filters and sort
    const args = prisma.order.findMany.mock.calls[0][0];
    expect(args.where.status).toBe('COMPLETED');
    expect(args.orderBy.createdAt).toBe('asc');
  });

  it('returns only header when there are no orders', async () => {
    const { auth, prisma } = await getMocks();
    auth.mockResolvedValue({ user: { id: 'user-1' } } as any);
    prisma.order.findMany.mockResolvedValue([] as any);

    const mod = await import('@/app/api/profile/orders/export.csv/route');
    const res = await mod.GET(new Request('http://localhost/api/profile/orders/export.csv'));
    const text = await res.text();
    expect(text).toBe('order_id,created_at,status,restaurant,items_count,total_cents,currency\n');
  });
});
