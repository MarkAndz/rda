import { auth } from '@/auth';
import { prisma } from '@/lib/db';
// format helpers used by OrderTable; page imports only its component
import OrderTable from '@/components/profile/OrderTable';

type OrderRow = {
  id: string;
  createdAt: Date;
  status: string;
  totalCents: number;
  restaurant: { name: string } | null;
  items: {
    quantity: number;
    priceCentsAtPurchase: number;
    item: { name: string } | null;
  }[];
};

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    // This path should normally be handled by middleware; add a friendly message as fallback.
    return (
      <div className="mx-auto max-w-6xl p-8 text-center">
        <h1 className="mb-4 text-2xl font-bold">Please sign in</h1>
        <p>Sign in to view your profile and order history.</p>
      </div>
    );
  }

  const pageSize = 20;
  const params = await searchParams;
  const page = Math.max(1, Number(params?.page) || 1);
  const skip = (page - 1) * pageSize;

  const [orders, totalCount, accounts] = await Promise.all([
    prisma.order.findMany({
      where: { customerId: session.user.id },
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
      select: {
        id: true,
        createdAt: true,
        status: true,
        totalCents: true,
        restaurant: { select: { name: true } },
        items: {
          select: {
            quantity: true,
            priceCentsAtPurchase: true,
            item: { select: { name: true } },
          },
        },
      },
    }) as Promise<OrderRow[]>,
    prisma.order.count({ where: { customerId: session.user.id } }),
    prisma.account.findMany({
      where: { userId: session.user.id },
      select: { provider: true, providerAccountId: true },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  return (
    <div className="mx-auto max-w-6xl p-8">
      <h1 className="mb-6 text-2xl font-bold">Your Profile</h1>

      <section className="mb-8 rounded-lg bg-white p-6 shadow">
        <div className="mb-6 flex items-center gap-6">
          {session.user.image ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={session.user.image}
                alt={session.user.name || 'User'}
                className="h-20 w-20 rounded-full"
              />
            </>
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gray-200 text-2xl font-bold text-gray-500">
              {session.user.name?.[0] || 'U'}
            </div>
          )}
          <div>
            <h2 className="text-xl font-medium">{session.user.name || 'User'}</h2>
            <p className="text-gray-600">{session.user.email || ''}</p>
          </div>
        </div>

        <div className="border-t pt-4">
          <h3 className="mb-2 font-medium">Connected Accounts</h3>
          {accounts && accounts.length > 0 ? (
            <ul className="grid grid-cols-2 gap-y-1 text-sm text-gray-800">
              {accounts.map((a, i) => (
                <li key={`${a.provider}-${i}`} className="flex items-center gap-2">
                  <span className="inline-block h-2 w-2 rounded-full bg-gray-400" />
                  <span className="capitalize">{a.provider}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-600">No connected accounts.</p>
          )}
        </div>
      </section>

      <section className="rounded-lg bg-white p-6 shadow">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Order History</h2>
          <span className="text-sm text-gray-500">
            {totalCount} order{totalCount === 1 ? '' : 's'}
          </span>
        </div>

        <OrderTable orders={orders} />

        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-end gap-2">
            <a
              className={`rounded border px-3 py-1 text-sm ${
                page <= 1 ? 'pointer-events-none opacity-50' : 'hover:bg-gray-50'
              }`}
              href={`/profile?page=${page - 1}`}
              aria-disabled={page <= 1}
            >
              Previous
            </a>
            <span className="text-sm text-gray-600">
              Page {page} of {totalPages}
            </span>
            <a
              className={`rounded border px-3 py-1 text-sm ${
                page >= totalPages ? 'pointer-events-none opacity-50' : 'hover:bg-gray-50'
              }`}
              href={`/profile?page=${page + 1}`}
              aria-disabled={page >= totalPages}
            >
              Next
            </a>
          </div>
        )}
      </section>
    </div>
  );
}
