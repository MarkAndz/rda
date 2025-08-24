import { auth } from '@/auth';
import { prisma } from '@/lib/db';

export const metadata = { title: 'Checkout | RDA' };

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
} = {}) {
  const session = await auth();
  if (!session?.user?.id) {
    return (
      <div className="mx-auto max-w-3xl p-8 text-center">
        <h1 className="mb-2 text-2xl font-bold">Please sign in</h1>
        <p>Sign in to view checkout.</p>
      </div>
    );
  }

  const sp = (await (searchParams || Promise.resolve({}))) as Record<
    string,
    string | string[] | undefined
  >;
  const err = typeof sp.error === 'string' ? sp.error : undefined;
  const errorText =
    err === 'state'
      ? 'Your checkout is not in a valid state.'
      : err === 'server'
        ? 'Unexpected error. Please try again.'
        : err === 'missing'
          ? 'Missing checkout.'
          : undefined;

  const checkout = await prisma.checkout.findFirst({
    where: { customerId: session.user.id, status: 'PENDING' },
    select: {
      id: true,
      subtotalCents: true,
      taxCents: true,
      feeCents: true,
      totalCents: true,
      orders: {
        select: {
          id: true,
          restaurant: { select: { name: true } },
          items: {
            select: {
              quantity: true,
              priceCentsAtPurchase: true,
              item: { select: { name: true } },
            },
          },
          totalCents: true,
        },
      },
    },
  });

  if (!checkout) {
    return (
      <div className="mx-auto max-w-3xl p-8 text-center">
        <h1 className="mb-4 text-2xl font-bold">Checkout</h1>
        <p className="text-gray-600">Your checkout is empty.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl p-8">
      <h1 className="mb-4 text-2xl font-bold">Checkout</h1>
      {errorText ? (
        <div className="mb-4 rounded border border-red-300 bg-red-50 p-3 text-sm text-red-800">
          {errorText}
        </div>
      ) : null}
      <div className="space-y-4">
        {checkout.orders.map((o) => (
          <div key={o.id} className="rounded border p-4">
            <h2 className="mb-2 text-lg font-semibold">{o.restaurant?.name}</h2>
            <ul className="list-disc pl-5">
              {o.items.map((it, idx) => (
                <li key={idx} className="text-sm text-gray-800">
                  {it.item?.name} × {it.quantity} — €{(it.priceCentsAtPurchase / 100).toFixed(2)}
                </li>
              ))}
            </ul>
            <div className="mt-2 text-sm font-medium">
              Order total: €{(o.totalCents / 100).toFixed(2)}
            </div>
          </div>
        ))}
      </div>
      <form method="post" action="/api/checkout/finalize" className="mt-6">
        <input type="hidden" name="checkoutId" value={checkout.id} />
        <button className="rounded border px-4 py-2 text-sm hover:bg-gray-50" type="submit">
          Place order
        </button>
      </form>
    </div>
  );
}
