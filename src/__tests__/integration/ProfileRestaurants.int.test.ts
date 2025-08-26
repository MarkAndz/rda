import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { prisma } from '@/lib/db';

// We will mock only auth; Prisma remains real to hit the SQLite test DB
vi.mock('@/auth', () => ({ auth: vi.fn() }));

async function getAuth() {
  const mod = await import('@/auth');
  return vi.mocked((mod as any).auth as ReturnType<typeof vi.fn>);
}

// Minimal seed helpers
async function resetDb() {
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.item.deleteMany();
  await prisma.restaurant.deleteMany();
  await prisma.checkout.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();
}

async function seedProfileData() {
  const user1 = await prisma.user.create({
    data: { email: 'u1@example.com', name: 'U1' },
  });
  const user2 = await prisma.user.create({
    data: { email: 'u2@example.com', name: 'U2' },
  });
  const r1 = await prisma.restaurant.create({
    data: { name: 'Test Resto', slug: 'test-resto', address: 'A1' },
  });
  const item1 = await prisma.item.create({
    data: {
      restaurantId: r1.id,
      name: 'Burger',
      originalPriceCents: 1599,
      discountedPriceCents: 1599,
      quantityAvailable: 10,
      expiresAt: new Date(Date.now() + 86_400_000),
    },
  });
  const item2 = await prisma.item.create({
    data: {
      restaurantId: r1.id,
      name: 'Fries',
      originalPriceCents: 500,
      discountedPriceCents: 500,
      quantityAvailable: 10,
      expiresAt: new Date(Date.now() + 86_400_000),
    },
  });
  const co1 = await prisma.checkout.create({ data: { customerId: user1.id, totalCents: 2599 } });
  const co2 = await prisma.checkout.create({ data: { customerId: user2.id, totalCents: 500 } });
  const ord1 = await prisma.order.create({
    data: {
      customerId: user1.id,
      checkoutId: co1.id,
      restaurantId: r1.id,
      status: 'COMPLETED',
      totalCents: 2599,
    },
  });
  await prisma.orderItem.createMany({
    data: [
      { orderId: ord1.id, itemId: item1.id, quantity: 1, priceCentsAtPurchase: 1599 },
      { orderId: ord1.id, itemId: item2.id, quantity: 2, priceCentsAtPurchase: 500 },
    ],
  });
  const ord2 = await prisma.order.create({
    data: {
      customerId: user2.id,
      checkoutId: co2.id,
      restaurantId: r1.id,
      status: 'PENDING',
      totalCents: 500,
    },
  });

  return { user1, user2, r1, ord1, ord2 };
}

describe('Integration: Profile + Restaurants', () => {
  beforeAll(async () => {
    await resetDb();
  });
  afterAll(async () => {
    await resetDb();
  });

  it('AC1: Guest mato prisijungimo kvietimą (Profile)', async () => {
    const auth = await getAuth();
    auth.mockResolvedValue(null as any);
    const { default: ProfilePage } = await import('@/app/profile/page');
    const el = await ProfilePage({ searchParams: Promise.resolve({}) as any });
    const html = renderToStaticMarkup(el as any);
    expect(html).toContain('Please sign in');
  });

  it('AC2/AC3/AC5: Prisijungęs vartotojas mato tik savo užsakymus, lentelės stulpelius ir View nuorodą', async () => {
    const { user1, ord1, ord2 } = await seedProfileData();
    const auth = await getAuth();
    auth.mockResolvedValue({ user: { id: user1.id, name: 'U1', email: 'u1@example.com' } } as any);

    const { default: ProfilePage } = await import('@/app/profile/page');
    const el = await ProfilePage({ searchParams: Promise.resolve({}) as any });
    const html = renderToStaticMarkup(el as any);

    // Tik savo užsakymai (nėra kito vartotojo ord2 short id)
    expect(html).toContain('Order History');
    expect(html).toContain('#' + ord1.id.slice(0, 8));
    expect(html).not.toContain('#' + ord2.id.slice(0, 8));

    // Lentelės stulpelių pavadinimai
    expect(html).toContain('Order');
    expect(html).toContain('Date');
    expect(html).toContain('Restaurant');
    expect(html).toContain('Items');
    expect(html).toContain('Status');
    expect(html).toContain('Total');

    // View nuoroda į detales
    expect(html).toContain(`/profile/orders/${ord1.id}`);
  });

  it('Restaurants: svečias gauna 401, prisijungęs gali sukurti ir mato sąraše', async () => {
    const { POST } = await import('@/app/api/restaurants/route');

    // Guest: auth = null => 401
    const auth = await getAuth();
    auth.mockResolvedValueOnce(null as any);
    const guestReq = {
      json: async () => ({ name: 'Guest Resto', address: 'Nope St' }),
    } as any;
    const guestRes = await POST(guestReq);
    expect(guestRes.status).toBe(401);

    // Authenticated: create restaurant succeeds and is listed
    const user = await prisma.user.create({ data: { email: 'creator@example.com', name: 'Creator' } });
    auth.mockResolvedValueOnce({ user: { id: user.id, email: user.email, name: user.name } } as any);
    const req = {
      json: async () => ({
        name: 'Integr Test Resto',
        address: 'Street 1',
        city: 'Ville',
        country: 'LT',
        postcode: '00001',
        latitude: 51.5,
        timezone: 'Europe/Vilnius',
        phone: '111',
        email: 'a@b.lt',
        description: 'desc',
        imageUrl: 'https://example.com/x.jpg',
      }),
    } as any;
    const res = await POST(req);
    expect(res.status).toBe(201);

    // DB membership created as OWNER
    const created = await prisma.restaurant.findFirst({ where: { slug: 'integr-test-resto' } });
    expect(created).toBeTruthy();
    const membership = await prisma.restaurantMember.findFirst({ where: { userId: user.id, restaurantId: created!.id } });
    expect(membership?.role).toBe('OWNER');

    // UI puslapyje jis randamas
    const { default: RestaurantsPage } = await import('@/app/restaurants/page');
    const el = await RestaurantsPage({ searchParams: Promise.resolve({}) as any });
    const html = renderToStaticMarkup(el as any);
    expect(html).toContain('Integr Test Resto');
  });
});
