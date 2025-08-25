import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ count: 0 }, { status: 200 });

  const checkout = await prisma.checkout.findFirst({
    where: { customerId: session.user.id, status: 'PENDING' },
    select: {
      orders: {
        select: {
          items: { select: { quantity: true } },
        },
      },
    },
  });

  const count =
    checkout?.orders.reduce((sum, o) => sum + o.items.reduce((s, i) => s + i.quantity, 0), 0) ?? 0;
  return NextResponse.json({ count });
}
