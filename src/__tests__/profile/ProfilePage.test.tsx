import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

vi.mock('@/auth', () => ({
  auth: vi.fn(),
}));

vi.mock('@/lib/db', () => ({
  prisma: {
    order: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
    account: {
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
      order: { findMany: ReturnType<typeof vi.fn>; count: ReturnType<typeof vi.fn> };
      account: { findMany: ReturnType<typeof vi.fn> };
    },
  };
}

type TestItem = { quantity: number; priceCentsAtPurchase: number; item: { name: string } };
type TestOrder = {
  id: string;
  createdAt: Date;
  status: string;
  totalCents: number;
  restaurant: { name: string };
  items: TestItem[];
};

function makeOrder(overrides?: Partial<TestOrder>): TestOrder {
  return {
    id: 'aaaaaaaa-1111-2222-3333',
    createdAt: new Date('2024-01-02T10:00:00Z'),
    status: 'COMPLETED',
    totalCents: 2599,
    restaurant: { name: 'Test Resto' },
    items: [
      { quantity: 1, priceCentsAtPurchase: 1599, item: { name: 'Burger' } },
      { quantity: 1, priceCentsAtPurchase: 1000, item: { name: 'Fries' } },
    ],
    ...overrides,
  };
}

describe('ProfilePage order history', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it('renders order rows for the signed-in user', async () => {
    const { auth, prisma } = await getMocks();
    auth.mockResolvedValue({ user: { id: 'user-1', name: 'Alice', email: 'a@example.com' } });
    prisma.order.findMany.mockResolvedValue([makeOrder(), makeOrder({ id: 'bbbbbbbb-xxxx' })]);
    prisma.order.count.mockResolvedValue(2);
    prisma.account.findMany.mockResolvedValue([
      { provider: 'github', providerAccountId: '123' },
      { provider: 'google', providerAccountId: '456' },
    ]);

    const { default: ProfilePage } = await import('@/app/profile/page');
    const el = await ProfilePage({ searchParams: Promise.resolve({}) as any });
    const html = renderToStaticMarkup(el as unknown as React.ReactElement);

    expect(html).toContain('Order History');
    expect(html).toContain('Test Resto');
    expect(html).toContain('#aaaaaaaa');
    expect(html).toContain('€25.99');
    // has a View link to details page
    expect(html).toContain('/profile/orders/aaaaaaaa-1111-2222-3333');
  });

  it('shows empty state when user has no orders', async () => {
    const { auth, prisma } = await getMocks();
    auth.mockResolvedValue({ user: { id: 'user-1' } });
    prisma.order.findMany.mockResolvedValue([]);
    prisma.order.count.mockResolvedValue(0);
    prisma.account.findMany.mockResolvedValue([]);

    const { default: ProfilePage } = await import('@/app/profile/page');
    const el = await ProfilePage({ searchParams: Promise.resolve({}) as any });
    const html = renderToStaticMarkup(el as unknown as React.ReactElement);

    expect(html).toContain('No orders yet');
  });

  it('renders pagination controls when there are more pages', async () => {
    const { auth, prisma } = await getMocks();
    auth.mockResolvedValue({ user: { id: 'user-1' } });
    prisma.order.findMany.mockResolvedValue(
      Array.from({ length: 20 }, (_, i) => makeOrder({ id: `id-${i}` })),
    );
    prisma.order.count.mockResolvedValue(25);
    prisma.account.findMany.mockResolvedValue([]);

    const { default: ProfilePage } = await import('@/app/profile/page');
    const el = await ProfilePage({ searchParams: Promise.resolve({}) as any });
    const html = renderToStaticMarkup(el as unknown as React.ReactElement);

    expect(html).toContain('Next');
    expect(html).toContain('/profile?page=2');
  });

  it('applies status filter and preserves in pagination links', async () => {
    const { auth, prisma } = await getMocks();
    auth.mockResolvedValue({ user: { id: 'user-1' } });
    prisma.order.findMany.mockResolvedValue([makeOrder({ status: 'COMPLETED' })]);
    prisma.order.count.mockResolvedValue(25);
    prisma.account.findMany.mockResolvedValue([]);

    const { default: ProfilePage } = await import('@/app/profile/page');
    const el = await ProfilePage({ searchParams: Promise.resolve({ status: 'COMPLETED' }) as any });
    const html = renderToStaticMarkup(el as unknown as React.ReactElement);

    expect(prisma.order.findMany).toHaveBeenCalled();
    const args = prisma.order.findMany.mock.calls[0][0];
    expect(args.where.status).toBe('COMPLETED');
    expect(html).toContain('/profile?page=2&amp;status=COMPLETED');
  });

  it('applies date range and sort oldest', async () => {
    const { auth, prisma } = await getMocks();
    auth.mockResolvedValue({ user: { id: 'user-1' } });
    prisma.order.findMany.mockResolvedValue([makeOrder()]);
    prisma.order.count.mockResolvedValue(1);
    prisma.account.findMany.mockResolvedValue([]);

    const { default: ProfilePage } = await import('@/app/profile/page');
    const el = await ProfilePage({
      searchParams: Promise.resolve({
        from: '2024-01-01',
        to: '2024-02-01',
        sort: 'oldest',
      }) as any,
    });
    renderToStaticMarkup(el as unknown as React.ReactElement);

    const args = prisma.order.findMany.mock.calls[0][0];
    expect(args.orderBy.createdAt).toBe('asc');
    expect(args.where.createdAt.gte).toBeInstanceOf(Date);
    expect(args.where.createdAt.lte).toBeInstanceOf(Date);
  });
});
