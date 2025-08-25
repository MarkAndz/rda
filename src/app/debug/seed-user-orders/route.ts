import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';

export async function POST() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Disabled in production' }, { status: 403 });
  }

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;

  // Use two restaurants if available
  const restaurants = await prisma.restaurant.findMany({
    where: { isActive: true },
    select: { id: true },
    take: 2,
  });
  if (restaurants.length === 0) {
    return NextResponse.json(
      { error: 'No restaurants found. Run prisma seed first.' },
      { status: 400 },
    );
  }

  // Create a completed checkout with two orders and some items
  const items = await prisma.item.findMany({
    where: { restaurantId: { in: restaurants.map((r) => r.id) } },
    take: 3,
    select: { id: true, restaurantId: true, discountedPriceCents: true },
  });
  if (items.length === 0) {
    return NextResponse.json({ error: 'No items found. Seed items first.' }, { status: 400 });
  }

  const result = await prisma.$transaction(async (tx) => {
    const checkout = await tx.checkout.create({
      data: {
        customerId: userId,
        status: 'COMPLETED',
        subtotalCents: 0,
        taxCents: 0,
        feeCents: 0,
        totalCents: 0,
      },
    });

    const byResto = new Map<string, { total: number; itemIds: { id: string; price: number }[] }>();
    for (const it of items) {
      const entry = byResto.get(it.restaurantId) || { total: 0, itemIds: [] };
      entry.total += it.discountedPriceCents;
      entry.itemIds.push({ id: it.id, price: it.discountedPriceCents });
      byResto.set(it.restaurantId, entry);
    }

    for (const [restaurantId, data] of byResto.entries()) {
      const order = await tx.order.create({
        data: {
          checkoutId: checkout.id,
          restaurantId,
          status: 'COMPLETED',
          totalCents: 0,
          customerId: userId,
        },
      });

      for (const i of data.itemIds) {
        await tx.orderItem.create({
          data: {
            orderId: order.id,
            itemId: i.id,
            quantity: 1,
            priceCentsAtPurchase: i.price,
          },
        });
        await tx.order.update({
          where: { id: order.id },
          data: { totalCents: { increment: i.price } },
        });
        await tx.checkout.update({
          where: { id: checkout.id },
          data: {
            subtotalCents: { increment: i.price },
            totalCents: { increment: i.price },
          },
        });
      }
    }

    return checkout.id;
  });

  return NextResponse.json({
    ok: true,
    message: 'Created sample completed orders',
    checkoutId: result,
  });
}
