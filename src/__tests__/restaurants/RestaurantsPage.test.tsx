import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

vi.mock('@/lib/db', () => ({
  prisma: {
    restaurant: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
  },
}));

async function getMocks() {
  const dbMod = await import('@/lib/db');
  return {
    prisma: (dbMod as unknown as { prisma: unknown }).prisma as {
      restaurant: { findMany: ReturnType<typeof vi.fn>; count: ReturnType<typeof vi.fn> };
    },
  };
}

function makeRestaurant(i: number) {
  return {
    id: `r-${i}`,
    slug: `slug-${i}`,
    name: `Resto ${i}`,
    city: i % 2 ? 'Riga' : null,
    imageUrl: null,
  };
}

describe('RestaurantsPage', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it('lists active restaurants with pagination controls', async () => {
    const { prisma } = await getMocks();
    prisma.restaurant.findMany.mockResolvedValue(
      Array.from({ length: 12 }, (_, i) => makeRestaurant(i)),
    );
    prisma.restaurant.count.mockResolvedValue(25);

    const { default: RestaurantsPage } = await import('@/app/restaurants/page');
    const el = await RestaurantsPage({ searchParams: Promise.resolve({}) as any });
    const html = renderToStaticMarkup(el as unknown as React.ReactElement);

    expect(html).toContain('Restaurants');
    expect(html).toContain('Resto 0');
    expect(html).toContain('/restaurants?page=2');
  });

  it('shows empty state when no restaurants', async () => {
    const { prisma } = await getMocks();
    prisma.restaurant.findMany.mockResolvedValue([]);
    prisma.restaurant.count.mockResolvedValue(0);

    const { default: RestaurantsPage } = await import('@/app/restaurants/page');
    const el = await RestaurantsPage({ searchParams: Promise.resolve({}) as any });
    const html = renderToStaticMarkup(el as unknown as React.ReactElement);

    expect(html).toContain('No restaurants found');
  });

  it('links to restaurant details page', async () => {
    const { prisma } = await getMocks();
    prisma.restaurant.findMany.mockResolvedValue([makeRestaurant(1)]);
    prisma.restaurant.count.mockResolvedValue(1);

    const { default: RestaurantsPage } = await import('@/app/restaurants/page');
    const el = await RestaurantsPage({ searchParams: Promise.resolve({}) as any });
    const html = renderToStaticMarkup(el as unknown as React.ReactElement);

    expect(html).toContain('/restaurants/slug-1');
  });
});
