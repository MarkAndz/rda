import { prisma } from '@/lib/db';
import CreateRestaurantButton from '@/components/restaurants/CreateRestaurantButton';

export const metadata = {
  title: 'Restaurants | RDA',
};

import RestaurantCard from '@/components/restaurants/RestaurantCard';

type SearchParams = Promise<{
  page?: string;
}>;

const PAGE_SIZE = 12;

export default async function RestaurantsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const page = Math.max(1, Number(params?.page) || 1);
  const skip = (page - 1) * PAGE_SIZE;

  const [restaurants, total] = await Promise.all([
    prisma.restaurant.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      skip,
      take: PAGE_SIZE,
      select: { id: true, slug: true, name: true, city: true, imageUrl: true },
    }),
    prisma.restaurant.count({ where: { isActive: true } }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const buildHref = (target: number) => {
    const qp = new URLSearchParams();
    qp.set('page', String(target));
    const q = qp.toString();
    return `/restaurants${q ? `?${q}` : ''}`;
  };

  return (
    <div className="mx-auto max-w-6xl p-8">
      <h1 className="mb-6 text-2xl font-bold">Restaurants</h1>

      <div className="mb-6 flex justify-end">
        <CreateRestaurantButton />
      </div>

      {restaurants.length === 0 ? (
        <div className="rounded-lg bg-white p-6 text-center text-gray-600 shadow">
          No restaurants found
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {restaurants.map((r) => (
            <RestaurantCard
              key={r.id}
              slug={r.slug}
              name={r.name}
              city={r.city}
              imageUrl={r.imageUrl}
            />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-end gap-2">
          <a
            className={`rounded border px-3 py-1 text-sm ${
              page <= 1 ? 'pointer-events-none opacity-50' : 'hover:bg-gray-50'
            }`}
            href={buildHref(page - 1)}
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
