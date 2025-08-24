import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const contentType = req.headers.get('content-type') || '';
  const accept = req.headers.get('accept') || '';
  const isForm = contentType.includes('application/x-www-form-urlencoded');
  const wantsHtml = accept.includes('text/html');

  let checkoutId: string | undefined;
  if (contentType.includes('application/json')) {
    const body: unknown = await req.json().catch(() => ({}));
    const parsed = body as { checkoutId?: string };
    checkoutId = parsed.checkoutId;
  } else if (isForm) {
    const form = await req.formData();
    checkoutId = String(form.get('checkoutId') || '');
  } else {
    const url = new URL(req.url);
    checkoutId = url.searchParams.get('checkoutId') || undefined;
  }
  if (!checkoutId) {
    if (isForm || wantsHtml) {
      const u = new URL('/checkout', req.url);
      u.searchParams.set('error', 'missing');
      return NextResponse.redirect(u, { status: 303 });
    }
    return NextResponse.json({ error: 'Missing checkoutId' }, { status: 400 });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const checkout = await tx.checkout.findFirst({
        where: { id: checkoutId, customerId: session.user.id, status: 'PENDING' },
        select: { id: true },
      });
      if (!checkout) {
        return { status: 409 as const, body: { error: 'Checkout not found or already completed' } };
      }

      await tx.order.updateMany({
        where: { checkoutId: checkout.id },
        data: { status: 'COMPLETED' },
      });
      await tx.checkout.update({ where: { id: checkout.id }, data: { status: 'COMPLETED' } });

      // Optionally determine a primary order for redirect; for now profile
      return { status: 200 as const, body: { redirectUrl: '/profile' } };
    });
    if (isForm || wantsHtml) {
      if (result.status === 200) {
        const redirectUrl = (result.body as { redirectUrl: string }).redirectUrl;
        return NextResponse.redirect(new URL(redirectUrl, req.url), {
          status: 303,
        });
      }
      const u = new URL('/checkout', req.url);
      u.searchParams.set('error', 'state');
      return NextResponse.redirect(u, { status: 303 });
    }
    return NextResponse.json(result.body, { status: result.status });
  } catch {
    if (isForm || wantsHtml) {
      const u = new URL('/checkout', req.url);
      u.searchParams.set('error', 'server');
      return NextResponse.redirect(u, { status: 303 });
    }
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
