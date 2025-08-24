import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

vi.mock('@/lib/db', () => ({
  prisma: {
    restaurant: {
      findUnique: vi.fn(),
    },
  },
}));

async function getMocks() {
  const dbMod = await import('@/lib/db');
  return {
    prisma: (dbMod as unknown as { prisma: unknown }).prisma as {
      restaurant: { findUnique: ReturnType<typeof vi.fn> };
    },
  };
}

function makeRestaurant(overrides?: any) {
  return {
    id: 'r1',
    name: 'Test Resto',
    city: 'Riga',
    description: 'Nice food',
    imageUrl: null,
    items: [
      {
        id: 'i1',
        name: 'Burger',
        originalPriceCents: 1299,
        discountedPriceCents: 999,
        quantityAvailable: 2,
        expiresAt: new Date('2099-01-01T10:00:00Z'),
        allergens: [{ name: 'Gluten' }],
      },
      {
        id: 'i2',
        name: 'Fries',
        originalPriceCents: 599,
        discountedPriceCents: 499,
        quantityAvailable: 0,
        expiresAt: new Date('2099-01-02T10:00:00Z'),
        allergens: [],
      },
    ],
    ...overrides,
  };
}

describe('RestaurantDetailsPage', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it('renders restaurant info and available items', async () => {
    const { prisma } = await getMocks();
    prisma.restaurant.findUnique.mockResolvedValue(makeRestaurant());

    const { default: Page } = await import('@/app/restaurants/[slug]/page');
    const el = await Page({ params: { slug: 'test-resto' } });
    const html = renderToStaticMarkup(el as unknown as React.ReactElement);

    expect(html).toContain('Test Resto');
    expect(html).toContain('Available items');
    expect(html).toContain('Burger');
    expect(html).toContain('€9.99');
    expect(html).toContain('/restaurants'); // breadcrumb
    expect(html).toContain('Sold out'); // Fries is sold out
  });

  it('404s when restaurant inactive or not found', async () => {
    const { prisma } = await getMocks();
    prisma.restaurant.findUnique.mockResolvedValue(null);

    const { default: Page } = await import('@/app/restaurants/[slug]/page');

    let threw = false;
    try {
      await Page({ params: { slug: 'unknown' } });
    } catch (e) {
      threw = true;
    }
    expect(threw).toBe(true);
  });
});
