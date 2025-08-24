import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

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

describe('CheckoutPage', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it('shows empty state when no pending checkout', async () => {
    const { auth, prisma } = await getMocks();
    auth.mockResolvedValue({ user: { id: 'u1' } });
    prisma.checkout.findFirst.mockResolvedValue(null);
    const { default: Page } = await import('@/app/checkout/page');
    const el = await Page();
    const html = renderToStaticMarkup(el as unknown as React.ReactElement);
    expect(html).toContain('Your checkout is empty');
  });

  it('renders orders and items when checkout exists', async () => {
    const { auth, prisma } = await getMocks();
    auth.mockResolvedValue({ user: { id: 'u1' } });
    prisma.checkout.findFirst.mockResolvedValue({
      id: 'c1',
      subtotalCents: 1000,
      taxCents: 0,
      feeCents: 0,
      totalCents: 1000,
      orders: [
        {
          id: 'o1',
          restaurant: { name: 'Test Resto' },
          items: [
            {
              quantity: 1,
              priceCentsAtPurchase: 500,
              item: { name: 'Burger' },
            },
          ],
          totalCents: 500,
        },
      ],
    });
    const { default: Page } = await import('@/app/checkout/page');
    const el = await Page();
    const html = renderToStaticMarkup(el as unknown as React.ReactElement);
    expect(html).toContain('Checkout');
    expect(html).toContain('Test Resto');
    expect(html).toContain('Burger');
    expect(html).toContain('Order total');
  });
});
