import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let itemId: string | undefined;
  const contentType = req.headers.get('content-type') || '';
  const accept = req.headers.get('accept') || '';
  const isForm = contentType.includes('application/x-www-form-urlencoded');
  const wantsHtml = accept.includes('text/html');
  if (contentType.includes('application/json')) {
    const body: unknown = await req.json().catch(() => ({}));
    const parsed = body as { itemId?: string };
    itemId = parsed.itemId;
  } else if (contentType.includes('application/x-www-form-urlencoded')) {
    const form = await req.formData();
    itemId = String(form.get('itemId') || '');
  } else {
    // Try URL param fallback
    const url = new URL(req.url);
    itemId = url.searchParams.get('itemId') || undefined;
  }

  if (!itemId) {
    // If browser form or HTML, redirect back to referer with error
    if (isForm || wantsHtml) {
      const referer = req.headers.get('referer') || '/restaurants';
      const u = new URL(referer);
      u.searchParams.set('error', 'missing');
      return NextResponse.redirect(u, { status: 303 });
    }
    return NextResponse.json({ error: 'Missing itemId' }, { status: 400 });
  }

  const now = new Date();

  try {
    const result = await prisma.$transaction(async (tx) => {
      const item = await tx.item.findUnique({
        where: { id: itemId! },
        select: {
          id: true,
          name: true,
          restaurantId: true,
          discountedPriceCents: true,
          expiresAt: true,
          quantityAvailable: true,
        },
      });
      if (!item) {
        return { status: 404 as const, body: { error: 'Item not found' } };
      }
      if (!(item.expiresAt > now)) {
        return { status: 409 as const, body: { error: 'Item expired' } };
      }

      // Atomically decrement stock if available
      const dec = await tx.item.updateMany({
        where: { id: item.id, quantityAvailable: { gt: 0 }, expiresAt: { gt: now } },
        data: { quantityAvailable: { decrement: 1 } },
      });
      if (dec.count === 0) {
        return { status: 409 as const, body: { error: 'Item sold out' } };
      }

      // Reuse or create pending checkout
      let checkout = await tx.checkout.findFirst({
        where: { customerId: session.user.id, status: 'PENDING' },
      });
      if (!checkout) {
        checkout = await tx.checkout.create({
          data: {
            customerId: session.user.id,
            status: 'PENDING',
            subtotalCents: 0,
            taxCents: 0,
            feeCents: 0,
            totalCents: 0,
          },
        });
      }

      // Reuse or create order for the restaurant under this checkout
      let order = await tx.order.findFirst({
        where: { checkoutId: checkout.id, restaurantId: item.restaurantId },
      });
      if (!order) {
        order = await tx.order.create({
          data: {
            checkoutId: checkout.id,
            restaurantId: item.restaurantId,
            status: 'PENDING',
            totalCents: 0,
            customerId: session.user.id,
          },
        });
      }

      // Upsert order item: increment quantity if already added
      await tx.orderItem.upsert({
        where: { orderId_itemId: { orderId: order.id, itemId: item.id } },
        update: { quantity: { increment: 1 } },
        create: {
          orderId: order.id,
          itemId: item.id,
          quantity: 1,
          priceCentsAtPurchase: item.discountedPriceCents,
        },
      });

      // Update totals
      order = await tx.order.update({
        where: { id: order.id },
        data: { totalCents: { increment: item.discountedPriceCents } },
      });
      checkout = await tx.checkout.update({
        where: { id: checkout.id },
        data: {
          subtotalCents: { increment: item.discountedPriceCents },
          totalCents: { increment: item.discountedPriceCents },
        },
      });

      return { status: 200 as const, body: { checkoutId: checkout.id, redirectUrl: '/checkout' } };
    });

    // If the client expects HTML (browser form post), redirect appropriately
    if (isForm || wantsHtml) {
      if (result.status === 200) {
        return NextResponse.redirect(new URL(result.body.redirectUrl, req.url), { status: 303 });
      }
      const referer = req.headers.get('referer') || '/restaurants';
      const u = new URL(referer);
      // map error keys to short codes
      const code =
        (result.body as { error?: string })?.error === 'Item sold out'
          ? 'soldout'
          : (result.body as { error?: string })?.error === 'Item expired'
            ? 'expired'
            : (result.body as { error?: string })?.error === 'Item not found'
              ? 'notfound'
              : 'error';
      u.searchParams.set('error', code);
      return NextResponse.redirect(u, { status: 303 });
    }

    return NextResponse.json(result.body, { status: result.status });
  } catch {
    if (isForm || wantsHtml) {
      const referer = req.headers.get('referer') || '/restaurants';
      const u = new URL(referer);
      u.searchParams.set('error', 'server');
      return NextResponse.redirect(u, { status: 303 });
    }
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
