import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { formatCents, formatDateTime } from '@/lib/format';
import { notFound } from 'next/navigation';

type OrderDetails = {
  id: string;
  createdAt: Date;
  status: string;
  totalCents: number;
  restaurant: { id: string; name: string } | null;
  items: {
    quantity: number;
    priceCentsAtPurchase: number;
    item: { id: string; name: string } | null;
  }[];
  checkout: {
    id: string;
    createdAt: Date;
    subtotalCents: number;
    taxCents: number;
    feeCents: number;
    totalCents: number;
  } | null;
};

export default async function OrderDetailsPage({
  params,
}: {
  params: Promise<{ id: string }> | { id: string };
}) {
  const session = await auth();
  if (!session?.user?.id) {
    // Normally gated by middleware; fail closed here.
    notFound();
  }

  const p = await params;
  const orderId = (p as { id: string }).id;

  const order = (await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      restaurant: { select: { id: true, name: true } },
      items: {
        select: {
          quantity: true,
          priceCentsAtPurchase: true,
          item: { select: { id: true, name: true } },
        },
      },
      checkout: {
        select: {
          id: true,
          createdAt: true,
          subtotalCents: true,
          taxCents: true,
          feeCents: true,
          totalCents: true,
        },
      },
      user: { select: { id: true } },
    },
  })) as unknown as (OrderDetails & { user?: { id: string | null } }) | null;

  if (!order || order.user?.id !== session!.user!.id) {
    notFound();
  }

  const shortId = order.id.slice(0, 8);
  const itemsSubtotal = order.items.reduce(
    (sum, it) => sum + (it.quantity || 0) * (it.priceCentsAtPurchase || 0),
    0,
  );
  const checkoutSubtotal = order.checkout?.subtotalCents ?? itemsSubtotal;
  const tax = order.checkout?.taxCents ?? 0;
  const fee = order.checkout?.feeCents ?? 0;
  const total = order.checkout?.totalCents ?? order.totalCents;

  return (
    <div className="mx-auto max-w-4xl p-8">
      <div className="mb-4">
        <a href="/profile" className="text-sm text-blue-600 hover:underline">
          ← Back to profile
        </a>
      </div>

      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Order #{shortId}</h1>
          <p className="mt-1 text-gray-600">
            Placed on {formatDateTime(new Date(order.createdAt))}
          </p>
        </div>
        <span
          className={
            'inline-flex items-center rounded px-2 py-0.5 text-xs ' +
            (order.status === 'COMPLETED'
              ? 'bg-green-100 text-green-800'
              : order.status === 'CANCELLED'
                ? 'bg-red-100 text-red-800'
                : 'bg-yellow-100 text-yellow-800')
          }
        >
          {order.status}
        </span>
      </header>

      <section className="mb-6 rounded-lg bg-white p-6 shadow">
        <div className="mb-4">
          <div className="text-sm text-gray-600">Restaurant</div>
          <div className="text-lg font-medium text-gray-900">{order.restaurant?.name ?? '-'}</div>
        </div>

        <div>
          <div className="mb-2 text-xs font-semibold text-gray-600 uppercase">Items</div>
          <table className="w-full table-fixed border-collapse text-left text-sm">
            <colgroup>
              <col className="w-[55%]" />
              <col className="w-[15%]" />
              <col className="w-[15%]" />
              <col className="w-[15%]" />
            </colgroup>
            <thead>
              <tr className="border-b text-gray-600">
                <th className="py-2">Name</th>
                <th className="py-2">Qty</th>
                <th className="py-2">Unit</th>
                <th className="py-2">Line total</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((it, i) => {
                const line = (it.quantity || 0) * (it.priceCentsAtPurchase || 0);
                return (
                  <tr key={i} className="border-b last:border-0">
                    <td className="py-2 text-gray-800">{it.item?.name ?? '-'}</td>
                    <td className="py-2 text-gray-800">{it.quantity}</td>
                    <td className="py-2 text-gray-800">{formatCents(it.priceCentsAtPurchase)}</td>
                    <td className="py-2 font-medium text-gray-900">{formatCents(line)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-4 border-t pt-3">
          <div className="ml-auto w-full max-w-xs text-sm">
            <div className="flex justify-between py-1 text-gray-700">
              <span>Subtotal</span>
              <span>{formatCents(checkoutSubtotal)}</span>
            </div>
            {(tax ?? 0) > 0 && (
              <div className="flex justify-between py-1 text-gray-700">
                <span>Tax</span>
                <span>{formatCents(tax)}</span>
              </div>
            )}
            {(fee ?? 0) > 0 && (
              <div className="flex justify-between py-1 text-gray-700">
                <span>Fees</span>
                <span>{formatCents(fee)}</span>
              </div>
            )}
            <div className="flex justify-between border-t pt-2 text-base font-semibold text-gray-900">
              <span>Total</span>
              <span>{formatCents(total)}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-lg bg-white p-6 shadow">
        <h2 className="mb-2 text-lg font-semibold">Payment</h2>
        {order.checkout ? (
          <div className="text-sm text-gray-700">
            <div>
              Payment session <span className="font-mono">#{order.checkout.id.slice(0, 8)}</span>
            </div>
            <div>Created at {formatDateTime(new Date(order.checkout.createdAt))}</div>
          </div>
        ) : (
          <div className="text-sm text-gray-600">No payment information available.</div>
        )}
      </section>
    </div>
  );
}
