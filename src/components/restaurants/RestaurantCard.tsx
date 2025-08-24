import Link from 'next/link';

type Props = {
  slug: string;
  name: string;
  city?: string | null;
  imageUrl?: string | null;
};

export function RestaurantCard({ slug, name, city, imageUrl }: Props) {
  return (
    <Link
      href={`/restaurants/${slug}`}
      className="group block overflow-hidden rounded-lg border bg-white shadow-sm hover:shadow"
    >
      <div className="h-40 w-full bg-gray-100">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt={name}
            className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.02]"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-gray-400">
            No image
          </div>
        )}
      </div>
      <div className="p-3">
        <h3 className="truncate text-base font-semibold text-gray-900">{name}</h3>
        <p className="text-sm text-gray-600">{city || '—'}</p>
      </div>
    </Link>
  );
}

export default RestaurantCard;
