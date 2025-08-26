import { prisma } from '@/lib/db';
import { formatCents, formatDateTime } from '@/lib/format';
import Countdown from '@/components/restaurants/CountdownNoSSR';
import AddToCartButton from '@/components/restaurants/AddToCartButton';
import QuantityLive from '@/components/restaurants/QuantityLive';
import Link from 'next/link';

export const metadata = {
  title: 'Deals | RDA',
};

type SearchParams = Promise<{
  page?: string;
}>;

const PAGE_SIZE = 12;

export default async function Home({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const page = Math.max(1, Number(params?.page) || 1);
  const skip = (page - 1) * PAGE_SIZE;
  const now = new Date();

  const where = {
    expiresAt: { gt: now },
    quantityAvailable: { gt: 0 },
    restaurant: { is: { isActive: true } },
  } as const;

  const [items, total] = await Promise.all([
    prisma.item.findMany({
      where,
      orderBy: [{ expiresAt: 'asc' }, { name: 'asc' }],
      skip,
      take: PAGE_SIZE,
      select: {
        id: true,
        name: true,
        originalPriceCents: true,
        discountedPriceCents: true,
        quantityAvailable: true,
        expiresAt: true,
        restaurant: { select: { name: true, slug: true } },
        allergens: { select: { name: true } },
      },
    }),
    prisma.item.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const buildHref = (target: number) => {
    const qp = new URLSearchParams();
    qp.set('page', String(target));
    const q = qp.toString();
    return `/${q ? `?${q}` : ''}`;
  };

  return (
    <div className="mx-auto max-w-6xl p-8">
      <h1 className="mb-6 text-2xl font-bold">Available items</h1>

      {items.length === 0 ? (
        <div className="rounded-lg bg-white p-6 text-center text-gray-600 shadow">
          No available items
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((it) => (
            <li key={it.id} className="rounded border p-4">
              <div className="mb-1 flex items-center justify-between">
                <h3 className="text-base font-semibold text-gray-900">{it.name}</h3>
                <div className="flex items-center gap-2">
                  <Countdown expiresAt={it.expiresAt} />
                </div>
              </div>
              <div className="mb-1 text-xs text-gray-600">
                from{' '}
                {it.restaurant?.slug ? (
                  <Link className="hover:underline" href={`/restaurants/${it.restaurant.slug}`}>
                    {it.restaurant?.name}
                  </Link>
                ) : (
                  <span>{it.restaurant?.name}</span>
                )}
              </div>
              <div className="mb-2 text-sm">
                <span className="font-medium text-green-700">
                  {formatCents(it.discountedPriceCents)}
                </span>{' '}
                <span className="text-gray-500 line-through">
                  {formatCents(it.originalPriceCents)}
                </span>
              </div>
              <div className="mb-2 text-xs text-gray-600">
                Expires: {formatDateTime(it.expiresAt)}
              </div>
              {it.allergens.length > 0 ? (
                <div className="flex flex-wrap gap-1 text-xs text-gray-700">
                  {it.allergens.map((a) => (
                    <span
                      key={a.name}
                      className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] text-gray-700"
                    >
                      {a.name}
                    </span>
                  ))}
                </div>
              ) : null}
              <div className="mt-3 flex items-center justify-between text-xs text-gray-600">
                <span>
                  Quantity: <QuantityLive itemId={it.id} initial={it.quantityAvailable} />
                </span>
                <div className="flex items-center gap-2">
                  <form method="post" action="/api/checkout/add">
                    <input type="hidden" name="itemId" value={it.id} />
                    <button
                      type="submit"
                      className="rounded border px-2 py-1 text-xs hover:bg-gray-50"
                      aria-label={`Buy ${it.name}`}
                    >
                      Buy
                    </button>
                  </form>
                  <AddToCartButton itemId={it.id} available={it.quantityAvailable} />
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-end gap-2">
          <a
            className={`rounded border px-3 py-1 text-sm ${page <= 1 ? 'pointer-events-none opacity-50' : 'hover:bg-gray-50'}`}
            href={buildHref(page - 1)}
            aria-disabled={page <= 1}
          >
            Previous
          </a>
          <span className="text-sm text-gray-600">
            Page {page} of {totalPages}
          </span>
          <a
            className={`rounded border px-3 py-1 text-sm ${page >= totalPages ? 'pointer-events-none opacity-50' : 'hover:bg-gray-50'}`}
            href={buildHref(page + 1)}
            aria-disabled={page >= totalPages}
          >
            Next
          </a>
        </div>
      )}
    </div>
  );
}
