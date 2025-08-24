import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { formatCents, formatDateTime } from '@/lib/format';
import Link from 'next/link';

type Params = { params: { slug: string } };

export async function generateMetadata({ params }: Params) {
  const r = await prisma.restaurant.findUnique({
    where: { slug: params.slug, isActive: true },
    select: { name: true },
  });
  return { title: r?.name ? `${r.name} | RDA` : 'Restaurant | RDA' };
}

export default async function RestaurantDetailsPage({ params }: Params) {
  const now = new Date();
  const restaurant = await prisma.restaurant.findUnique({
    where: { slug: params.slug, isActive: true },
    select: {
      id: true,
      name: true,
      city: true,
      description: true,
      imageUrl: true,
      items: {
        where: { expiresAt: { gt: now } },
        orderBy: [{ expiresAt: 'asc' }, { name: 'asc' }],
        select: {
          id: true,
          name: true,
          originalPriceCents: true,
          discountedPriceCents: true,
          quantityAvailable: true,
          expiresAt: true,
          allergens: { select: { name: true } },
        },
      },
    },
  });

  if (!restaurant) {
    notFound();
  }

  const items = restaurant.items;

  return (
    <div className="mx-auto max-w-6xl p-8">
      <nav className="mb-4 text-sm text-gray-600">
        <Link href="/restaurants" className="hover:underline">
          Restaurants
        </Link>{' '}
        / <span className="text-gray-900">{restaurant.name}</span>
      </nav>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="md:col-span-2">
          <h1 className="mb-2 text-2xl font-bold">{restaurant.name}</h1>
          <p className="mb-2 text-gray-700">{restaurant.city || ''}</p>
          {restaurant.description ? (
            <p className="text-gray-700">{restaurant.description}</p>
          ) : null}
        </div>
        <div>
          <div className="h-40 w-full overflow-hidden rounded bg-gray-100">
            {restaurant.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={restaurant.imageUrl}
                alt={restaurant.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-gray-400">
                No image
              </div>
            )}
          </div>
        </div>
      </div>

      <section className="rounded-lg bg-white p-6 shadow">
        <h2 className="mb-4 text-xl font-semibold">Available items</h2>
        {items.length === 0 ? (
          <p className="text-gray-600">No available items.</p>
        ) : (
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((it) => (
              <li key={it.id} className="rounded border p-4">
                <div className="mb-1 flex items-center justify-between">
                  <h3 className="text-base font-semibold text-gray-900">{it.name}</h3>
                  {it.quantityAvailable === 0 ? (
                    <span className="rounded bg-gray-200 px-2 py-0.5 text-xs text-gray-700">
                      Sold out
                    </span>
                  ) : null}
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
                  <div className="text-xs text-gray-700">
                    Allergens: {it.allergens.map((a) => a.name).join(', ')}
                  </div>
                ) : null}
                <div className="mt-3 text-xs text-gray-600">Quantity: {it.quantityAvailable}</div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
