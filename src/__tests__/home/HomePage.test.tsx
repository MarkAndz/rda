import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

vi.mock('@/lib/db', () => ({
  prisma: {
    item: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
  },
}));

async function getMocks() {
  const dbMod = await import('@/lib/db');
  return {
    prisma: (dbMod as unknown as { prisma: unknown }).prisma as {
      item: { findMany: ReturnType<typeof vi.fn>; count: ReturnType<typeof vi.fn> };
    },
  };
}

function makeItem(i: number) {
  return {
    id: `i-${i}`,
    name: `Item ${i}`,
    originalPriceCents: 1299,
    discountedPriceCents: 999,
    quantityAvailable: 3,
    expiresAt: new Date('2099-01-01T10:00:00Z'),
    restaurant: { name: `Resto ${i}`, slug: `slug-${i}` },
    allergens: i % 2 ? [{ name: 'Gluten' }] : [],
  };
}

describe('HomePage - Global listings', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it('renders available items and links to restaurant page', async () => {
    const { prisma } = await getMocks();
    prisma.item.findMany.mockResolvedValue([makeItem(1), makeItem(2)]);
    prisma.item.count.mockResolvedValue(2);

    const { default: Home } = await import('@/app/page');
    const el = await Home({ searchParams: Promise.resolve({}) as any });
    const html = renderToStaticMarkup(el as unknown as React.ReactElement);

    expect(html).toContain('Available items');
    expect(html).toContain('Item 1');
    expect(html).toContain('€9.99');
    expect(html).toContain('/restaurants/slug-1');
  });

  it('shows empty state when no items available', async () => {
    const { prisma } = await getMocks();
    prisma.item.findMany.mockResolvedValue([]);
    prisma.item.count.mockResolvedValue(0);

    const { default: Home } = await import('@/app/page');
    const el = await Home({ searchParams: Promise.resolve({}) as any });
    const html = renderToStaticMarkup(el as unknown as React.ReactElement);

    expect(html).toContain('No available items');
  });

  it('renders pagination links', async () => {
    const { prisma } = await getMocks();
    prisma.item.findMany.mockResolvedValue(Array.from({ length: 12 }, (_, i) => makeItem(i)));
    prisma.item.count.mockResolvedValue(30);

    const { default: Home } = await import('@/app/page');
    const el = await Home({ searchParams: Promise.resolve({ page: '1' }) as any });
    const html = renderToStaticMarkup(el as unknown as React.ReactElement);

    expect(html).toContain('Page 1 of 3');
    expect(html).toContain('/?page=2');
  });
});
