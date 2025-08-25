import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';

async function adjustQuantity(userId: string, itemId: string, delta: -1 | 1) {
  const now = new Date();
  return prisma.$transaction(async (tx) => {
    const checkout = await tx.checkout.findFirst({
      where: { customerId: userId, status: 'PENDING' },
      select: { id: true },
    });
    if (!checkout) return { status: 404 as const, body: { error: 'No pending checkout' } };

    const order = await tx.order.findFirst({
      where: { checkoutId: checkout.id, items: { some: { itemId } } },
      select: { id: true },
    });
    if (!order) return { status: 404 as const, body: { error: 'Item not in checkout' } };

    const oi = await tx.orderItem.findUnique({
      where: { orderId_itemId: { orderId: order.id, itemId } },
      select: { quantity: true, priceCentsAtPurchase: true },
    });
    if (!oi) return { status: 404 as const, body: { error: 'Item not in checkout' } };

    if (delta > 0) {
      const item = await tx.item.findUnique({
        where: { id: itemId },
        select: { quantityAvailable: true, expiresAt: true },
      });
      if (!item || !(item.expiresAt > now))
        return { status: 409 as const, body: { error: 'expired' } };
      const dec = await tx.item.updateMany({
        where: { id: itemId, quantityAvailable: { gt: 0 }, expiresAt: { gt: now } },
        data: { quantityAvailable: { decrement: 1 } },
      });
      if (dec.count === 0) return { status: 409 as const, body: { error: 'soldout' } };
    }

    if (delta < 0) {
      await tx.item.update({
        where: { id: itemId },
        data: { quantityAvailable: { increment: 1 } },
      });
    }

    let appliedDelta: number = delta;
    let orderDeleted = false;
    if (oi.quantity + delta <= 0) {
      appliedDelta = -oi.quantity;
      await tx.orderItem.delete({ where: { orderId_itemId: { orderId: order.id, itemId } } });
      // If order is now empty, clean it up
      const remaining = await tx.orderItem.count({ where: { orderId: order.id } });
      if (remaining === 0) {
        await tx.order.delete({ where: { id: order.id } });
        orderDeleted = true;
      }
    } else {
      await tx.orderItem.update({
        where: { orderId_itemId: { orderId: order.id, itemId } },
        data: { quantity: { increment: delta } },
      });
    }

    const price = oi.priceCentsAtPurchase * appliedDelta;
    if (!orderDeleted) {
      await tx.order.update({
        where: { id: order.id },
        data: { totalCents: { increment: price } },
      });
    }
    const checkoutUpdate = await tx.checkout.update({
      where: { id: checkout.id },
      data: { subtotalCents: { increment: price }, totalCents: { increment: price } },
    });
    return { status: 200 as const, body: { ok: true, checkoutId: checkoutUpdate.id } };
  });
}

async function removeItem(userId: string, itemId: string) {
  return prisma.$transaction(async (tx) => {
    const checkout = await tx.checkout.findFirst({
      where: { customerId: userId, status: 'PENDING' },
      select: { id: true },
    });
    if (!checkout) return { status: 404 as const, body: { error: 'No pending checkout' } };

    const order = await tx.order.findFirst({
      where: { checkoutId: checkout.id, items: { some: { itemId } } },
      select: { id: true },
    });
    if (!order) return { status: 404 as const, body: { error: 'Item not in checkout' } };

    const oi = await tx.orderItem.findUnique({
      where: { orderId_itemId: { orderId: order.id, itemId } },
      select: { quantity: true, priceCentsAtPurchase: true },
    });
    if (!oi) return { status: 404 as const, body: { error: 'Item not in checkout' } };

    await tx.orderItem.delete({ where: { orderId_itemId: { orderId: order.id, itemId } } });
    let orderDeleted = false;
    // If order is now empty, clean it up
    const remainingAfterDelete = await tx.orderItem.count({ where: { orderId: order.id } });
    if (remainingAfterDelete === 0) {
      await tx.order.delete({ where: { id: order.id } });
      orderDeleted = true;
    }
    await tx.item.update({
      where: { id: itemId },
      data: { quantityAvailable: { increment: oi.quantity } },
    });
    const deltaTotal = -(oi.quantity * oi.priceCentsAtPurchase);
    if (!orderDeleted) {
      await tx.order.update({
        where: { id: order.id },
        data: { totalCents: { increment: deltaTotal } },
      });
    }
    const checkoutUpdate = await tx.checkout.update({
      where: { id: checkout.id },
      data: { subtotalCents: { increment: deltaTotal }, totalCents: { increment: deltaTotal } },
    });
    return { status: 200 as const, body: { ok: true, checkoutId: checkoutUpdate.id } };
  });
}

function wantsHtml(req: Request) {
  const contentType = req.headers.get('content-type') || '';
  const accept = req.headers.get('accept') || '';
  return contentType.includes('application/x-www-form-urlencoded') || accept.includes('text/html');
}

function redirectToCheckout(req: Request, params?: Record<string, string>) {
  const u = new URL('/checkout', req.url);
  if (params) Object.entries(params).forEach(([k, v]) => u.searchParams.set(k, v));
  return NextResponse.redirect(u, { status: 303 });
}

export async function POST(req: Request) {
  // Form-aware entry point: expects op=inc|dec|remove and itemId
  const session = await auth();
  if (!session?.user?.id)
    return wantsHtml(req)
      ? redirectToCheckout(req, { error: 'unauth' })
      : NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let itemId: string | undefined;
  let op: 'inc' | 'dec' | 'remove' | undefined;
  const contentType = req.headers.get('content-type') || '';
  if (contentType.includes('application/x-www-form-urlencoded')) {
    const form = await req.formData();
    itemId = String(form.get('itemId') || '');
    const methodOverride = String(form.get('_method') || '').toUpperCase();
    const opField = String(form.get('op') || '').toLowerCase();
    if (opField === 'inc' || opField === 'dec' || opField === 'remove') op = opField;
    // Support _method overrides
    if (!op && methodOverride === 'PATCH') op = 'inc';
    if (!op && methodOverride === 'DELETE') op = 'remove';
  } else if (contentType.includes('application/json')) {
    const body = (await req.json().catch(() => ({}))) as { itemId?: string; op?: string };
    itemId = body.itemId;
    const maybeOp = String(body.op || '').toLowerCase();
    if (maybeOp === 'inc' || maybeOp === 'dec' || maybeOp === 'remove') op = maybeOp;
  } else {
    const url = new URL(req.url);
    itemId = url.searchParams.get('itemId') || undefined;
    const maybeOp = String(url.searchParams.get('op') || '').toLowerCase();
    if (maybeOp === 'inc' || maybeOp === 'dec' || maybeOp === 'remove') op = maybeOp as any;
  }

  if (!itemId || !op) {
    return wantsHtml(req)
      ? redirectToCheckout(req, { error: 'missing' })
      : NextResponse.json({ error: 'Bad request' }, { status: 400 });
  }

  try {
    const result =
      op === 'remove'
        ? await removeItem(session.user.id, itemId)
        : await adjustQuantity(session.user.id, itemId, op === 'inc' ? 1 : -1);
    if (wantsHtml(req)) {
      if (result.status === 200) return redirectToCheckout(req);
      const err = (result.body as any)?.error;
      const map: Record<string, string> = {
        soldout: 'soldout',
        expired: 'expired',
        'No pending checkout': 'missing',
        'Item not in checkout': 'notfound',
      };
      return redirectToCheckout(req, { error: map[err] || 'error' });
    }
    return NextResponse.json(result.body, { status: result.status });
  } catch {
    return wantsHtml(req)
      ? redirectToCheckout(req, { error: 'server' })
      : NextResponse.json({ error: 'server' }, { status: 500 });
  }
}

// PATCH: update quantity of an item in the current pending checkout (increment/decrement)
export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = (await req.json().catch(() => ({}))) as {
    itemId?: string;
    delta?: number; // +1 or -1
  };
  const itemId = body.itemId;
  const rawDelta = typeof body.delta === 'number' ? Math.trunc(body.delta) : 0;
  const delta = rawDelta > 0 ? 1 : rawDelta < 0 ? -1 : 0; // clamp to -1, 0, 1
  if (!itemId || delta === 0) return NextResponse.json({ error: 'Bad request' }, { status: 400 });

  try {
    const result = await adjustQuantity(session.user.id, itemId, delta as -1 | 1);
    return NextResponse.json(result.body, { status: result.status });
  } catch {
    return NextResponse.json({ error: 'server' }, { status: 500 });
  }
}

// DELETE: remove an item entirely from checkout
export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const itemId = searchParams.get('itemId') || undefined;
  if (!itemId) return NextResponse.json({ error: 'Bad request' }, { status: 400 });

  try {
    const result = await removeItem(session.user.id, itemId);
    return NextResponse.json(result.body, { status: result.status });
  } catch {
    return NextResponse.json({ error: 'server' }, { status: 500 });
  }
}
