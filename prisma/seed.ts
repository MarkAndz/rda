import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const now = new Date();
  const inHours = (h: number) => new Date(now.getTime() + h * 60 * 60 * 1000);
  const inMinutes = (m: number) => new Date(now.getTime() + m * 60 * 1000);
  const agoMinutes = (m: number) => new Date(now.getTime() - m * 60 * 1000);

  // Restaurants
  const restos = [
    {
      name: 'Central Bistro',
      slug: 'central-bistro',
      address: '1 Main St',
      city: 'Riga',
      country: 'LV',
      description: 'Casual dining in the heart of the city.',
      imageUrl: null as string | null,
      isActive: true,
    },
    {
      name: 'Sunset Sushi',
      slug: 'sunset-sushi',
      address: '22 River Road',
      city: 'Riga',
      country: 'LV',
      description: 'Fresh rolls and bowls.',
      imageUrl: null,
      isActive: true,
    },
    {
      name: 'Pasta Palace',
      slug: 'pasta-palace',
      address: '7 Olive Lane',
      city: 'Riga',
      country: 'LV',
      description: 'Hearty Italian classics.',
      imageUrl: null,
      isActive: true,
    },
    {
      name: 'Taco Loco',
      slug: 'taco-loco',
      address: '55 Market Ave',
      city: 'Riga',
      country: 'LV',
      description: 'Street-style tacos and sides.',
      imageUrl: null,
      isActive: true,
    },
    {
      name: 'Green Bowl',
      slug: 'green-bowl',
      address: '18 Park Street',
      city: 'Riga',
      country: 'LV',
      description: 'Fresh salads and healthy bowls.',
      imageUrl: null,
      isActive: true,
    },
    // Active restaurant with no items
    {
      name: 'Empty Kitchen',
      slug: 'empty-kitchen',
      address: '99 Silent Way',
      city: 'Riga',
      country: 'LV',
      description: 'A restaurant with no items yet.',
      imageUrl: null,
      isActive: true,
    },
    // Inactive restaurant (should be hidden from catalog)
    {
      name: 'Closed Diner',
      slug: 'closed-diner',
      address: '404 Gone St',
      city: 'Riga',
      country: 'LV',
      description: 'Temporarily closed for renovation.',
      imageUrl: null,
      isActive: false,
    },
    {
      name: 'Nordic Bakery',
      slug: 'nordic-bakery',
      address: '12 Birch Road',
      city: 'Riga',
      country: 'LV',
      description: 'Fresh breads and pastries.',
      imageUrl: null,
      isActive: true,
    },
    {
      name: 'Curry House',
      slug: 'curry-house',
      address: '8 Spice Street',
      city: 'Riga',
      country: 'LV',
      description: 'Indian curries and tandoor.',
      imageUrl: null,
      isActive: true,
    },
    {
      name: 'BBQ Pit',
      slug: 'bbq-pit',
      address: '3 Smoke Ave',
      city: 'Jurmala',
      country: 'LV',
      description: 'Low and slow smoked meats.',
      imageUrl: null,
      isActive: true,
    },
    {
      name: 'Vegan Deli',
      slug: 'vegan-deli',
      address: '21 Greenway',
      city: 'Riga',
      country: 'LV',
      description: 'Plant-based sandwiches and bowls.',
      imageUrl: null,
      isActive: true,
    },
  ];

  for (const r of restos) {
    await prisma.restaurant.upsert({
      where: { slug: r.slug },
      update: r,
      create: r,
    });
  }

  const slugs = restos.map((r) => r.slug);
  const restaurants = await prisma.restaurant.findMany({ where: { slug: { in: slugs } } });
  if (restaurants.length !== restos.length)
    throw new Error('Seed: restaurants not found after upsert');
  const bySlug = new Map(restaurants.map((r) => [r.slug, r] as const));

  // Allergens (for diverse items)
  const allergenNames = ['Gluten', 'Dairy', 'Nuts', 'Seafood', 'Soy', 'Sesame'];
  for (const name of allergenNames) {
    await prisma.allergen.upsert({ where: { name }, update: {}, create: { name } });
  }

  // Items
  const items = [
    // Central Bistro
    {
      restaurantId: bySlug.get('central-bistro')!.id,
      name: 'Beef Burger',
      description: '200g patty, cheddar, pickles',
      originalPriceCents: 1299,
      discountedPriceCents: 899,
      quantityAvailable: 10,
      expiresAt: inHours(8),
      imageUrl: null as string | null,
      allergens: ['Gluten', 'Dairy'],
    },
    {
      restaurantId: bySlug.get('central-bistro')!.id,
      name: 'Veggie Wrap',
      description: 'Hummus, grilled veg, spinach',
      originalPriceCents: 999,
      discountedPriceCents: 699,
      quantityAvailable: 6,
      expiresAt: inHours(6),
      imageUrl: null,
      allergens: ['Gluten'],
    },
    {
      restaurantId: bySlug.get('central-bistro')!.id,
      name: 'Fries',
      description: 'Crispy skin-on fries',
      originalPriceCents: 399,
      discountedPriceCents: 249,
      quantityAvailable: 3,
      expiresAt: inMinutes(5), // near expiry
      imageUrl: null,
    },

    // Sunset Sushi
    {
      restaurantId: bySlug.get('sunset-sushi')!.id,
      name: 'Salmon Roll',
      description: '8 pcs',
      originalPriceCents: 1099,
      discountedPriceCents: 749,
      quantityAvailable: 12,
      expiresAt: inHours(10),
      imageUrl: null,
      allergens: ['Seafood', 'Gluten', 'Soy'],
    },
    {
      restaurantId: bySlug.get('sunset-sushi')!.id,
      name: 'Spicy Tuna Roll',
      description: '8 pcs, spicy mayo',
      originalPriceCents: 1199,
      discountedPriceCents: 799,
      quantityAvailable: 5,
      expiresAt: inMinutes(7), // near expiry
      imageUrl: null,
      allergens: ['Seafood', 'Gluten', 'Soy'],
    },
    {
      restaurantId: bySlug.get('sunset-sushi')!.id,
      name: 'Miso Soup',
      description: 'Tofu, wakame',
      originalPriceCents: 299,
      discountedPriceCents: 199,
      quantityAvailable: 10,
      expiresAt: inHours(2),
      imageUrl: null,
      allergens: ['Soy'],
    },

    // Pasta Palace
    {
      restaurantId: bySlug.get('pasta-palace')!.id,
      name: 'Spaghetti Carbonara',
      description: 'Pecorino, pancetta, egg',
      originalPriceCents: 1399,
      discountedPriceCents: 949,
      quantityAvailable: 8,
      expiresAt: inHours(4),
      imageUrl: null,
      allergens: ['Gluten', 'Dairy'],
    },
    {
      restaurantId: bySlug.get('pasta-palace')!.id,
      name: 'Penne Arrabbiata',
      description: 'Tomato, chili, garlic',
      originalPriceCents: 1199,
      discountedPriceCents: 799,
      quantityAvailable: 7,
      expiresAt: inHours(3),
      imageUrl: null,
      allergens: ['Gluten'],
    },
    {
      restaurantId: bySlug.get('pasta-palace')!.id,
      name: 'Garlic Bread',
      description: 'Herb butter',
      originalPriceCents: 499,
      discountedPriceCents: 299,
      quantityAvailable: 4,
      expiresAt: inMinutes(9), // near expiry
      imageUrl: null,
      allergens: ['Gluten', 'Dairy'],
    },

    // Taco Loco
    {
      restaurantId: bySlug.get('taco-loco')!.id,
      name: 'Chicken Taco',
      description: 'Corn tortilla, pico, cilantro',
      originalPriceCents: 499,
      discountedPriceCents: 349,
      quantityAvailable: 15,
      expiresAt: inHours(5),
      imageUrl: null,
    },
    {
      restaurantId: bySlug.get('taco-loco')!.id,
      name: 'Veggie Taco',
      description: 'Black beans, corn, salsa',
      originalPriceCents: 449,
      discountedPriceCents: 299,
      quantityAvailable: 10,
      expiresAt: inHours(5),
      imageUrl: null,
    },
    {
      restaurantId: bySlug.get('taco-loco')!.id,
      name: 'Churros',
      description: 'Cinnamon sugar',
      originalPriceCents: 399,
      discountedPriceCents: 249,
      quantityAvailable: 9,
      expiresAt: inHours(1),
      imageUrl: null,
      allergens: ['Gluten'],
    },

    // Green Bowl
    {
      restaurantId: bySlug.get('green-bowl')!.id,
      name: 'Caesar Salad',
      description: 'Parmesan, croutons',
      originalPriceCents: 999,
      discountedPriceCents: 699,
      quantityAvailable: 10,
      expiresAt: inHours(3),
      imageUrl: null,
      allergens: ['Dairy', 'Gluten'],
    },
    {
      restaurantId: bySlug.get('green-bowl')!.id,
      name: 'Quinoa Bowl',
      description: 'Roasted veg, tahini',
      originalPriceCents: 1199,
      discountedPriceCents: 849,
      quantityAvailable: 8,
      expiresAt: inHours(6),
      imageUrl: null,
    },

    // Nordic Bakery
    {
      restaurantId: bySlug.get('nordic-bakery')!.id,
      name: 'Sourdough Loaf',
      description: 'Crusty artisan bread',
      originalPriceCents: 699,
      discountedPriceCents: 449,
      quantityAvailable: 0, // sold out
      expiresAt: inHours(12),
      imageUrl: null,
      allergens: ['Gluten'],
    },
    {
      restaurantId: bySlug.get('nordic-bakery')!.id,
      name: 'Blueberry Muffin',
      description: 'With crumble topping',
      originalPriceCents: 399,
      discountedPriceCents: 249,
      quantityAvailable: 6,
      expiresAt: agoMinutes(5), // already expired
      imageUrl: null,
      allergens: ['Gluten', 'Dairy'],
    },
    {
      restaurantId: bySlug.get('nordic-bakery')!.id,
      name: 'Gluten-Free Brownie',
      description: 'Rich chocolate',
      originalPriceCents: 449,
      discountedPriceCents: 299,
      quantityAvailable: 3,
      expiresAt: inHours(8),
      imageUrl: null,
      allergens: ['Nuts'],
    },

    // Curry House
    {
      restaurantId: bySlug.get('curry-house')!.id,
      name: 'Chicken Tikka Masala',
      description: 'Creamy tomato sauce',
      originalPriceCents: 1399,
      discountedPriceCents: 999,
      quantityAvailable: 7,
      expiresAt: inHours(4),
      imageUrl: null,
      allergens: ['Dairy'],
    },
    {
      restaurantId: bySlug.get('curry-house')!.id,
      name: 'Chana Masala',
      description: 'Spiced chickpeas',
      originalPriceCents: 999,
      discountedPriceCents: 699,
      quantityAvailable: 10,
      expiresAt: inHours(6),
      imageUrl: null,
    },
    {
      restaurantId: bySlug.get('curry-house')!.id,
      name: 'Garlic Naan',
      description: 'Buttery and soft',
      originalPriceCents: 399,
      discountedPriceCents: 249,
      quantityAvailable: 5,
      expiresAt: inMinutes(8),
      imageUrl: null,
      allergens: ['Gluten', 'Dairy'],
    },

    // BBQ Pit
    {
      restaurantId: bySlug.get('bbq-pit')!.id,
      name: 'Pulled Pork Sandwich',
      description: 'Brioche bun',
      originalPriceCents: 1199,
      discountedPriceCents: 849,
      quantityAvailable: 5,
      expiresAt: inHours(5),
      imageUrl: null,
      allergens: ['Gluten'],
    },
    {
      restaurantId: bySlug.get('bbq-pit')!.id,
      name: 'Smoked Ribs',
      description: 'Half rack',
      originalPriceCents: 1599,
      discountedPriceCents: 1099,
      quantityAvailable: 2,
      expiresAt: agoMinutes(15), // expired
      imageUrl: null,
    },
    {
      restaurantId: bySlug.get('bbq-pit')!.id,
      name: 'Coleslaw',
      description: 'Creamy dressing',
      originalPriceCents: 299,
      discountedPriceCents: 199,
      quantityAvailable: 9,
      expiresAt: inHours(3),
      imageUrl: null,
      allergens: ['Dairy'],
    },

    // Vegan Deli
    {
      restaurantId: bySlug.get('vegan-deli')!.id,
      name: 'Tofu Banh Mi',
      description: 'Pickled veg, cilantro',
      originalPriceCents: 899,
      discountedPriceCents: 599,
      quantityAvailable: 6,
      expiresAt: inHours(4),
      imageUrl: null,
      allergens: ['Soy', 'Gluten', 'Sesame'],
    },
    {
      restaurantId: bySlug.get('vegan-deli')!.id,
      name: 'Kale Caesar (Vegan)',
      description: 'Cashew dressing',
      originalPriceCents: 999,
      discountedPriceCents: 749,
      quantityAvailable: 4,
      expiresAt: inHours(5),
      imageUrl: null,
      allergens: ['Nuts'],
    },
    {
      restaurantId: bySlug.get('vegan-deli')!.id,
      name: 'Falafel Bowl',
      description: 'Tahini sauce',
      originalPriceCents: 1099,
      discountedPriceCents: 799,
      quantityAvailable: 8,
      expiresAt: inHours(6),
      imageUrl: null,
      allergens: ['Sesame'],
    },
    {
      restaurantId: bySlug.get('green-bowl')!.id,
      name: 'Fruit Cup',
      description: 'Seasonal mix',
      originalPriceCents: 499,
      discountedPriceCents: 349,
      quantityAvailable: 5,
      expiresAt: inMinutes(6), // near expiry
      imageUrl: null,
    },
    // Note: no items for 'empty-kitchen' and none for 'closed-diner'
  ];

  for (const it of items as Array<{
    restaurantId: string;
    name: string;
    description?: string | null;
    originalPriceCents: number;
    discountedPriceCents: number;
    quantityAvailable: number;
    expiresAt: Date;
    imageUrl?: string | null;
    allergens?: string[];
  }>) {
    const where = { restaurantId_name: { restaurantId: it.restaurantId, name: it.name } } as const;
    await prisma.item.upsert({
      where,
      update: {
        description: it.description ?? null,
        originalPriceCents: it.originalPriceCents,
        discountedPriceCents: it.discountedPriceCents,
        quantityAvailable: it.quantityAvailable,
        expiresAt: it.expiresAt,
        imageUrl: it.imageUrl ?? null,
      },
      create: {
        restaurantId: it.restaurantId,
        name: it.name,
        description: it.description ?? null,
        originalPriceCents: it.originalPriceCents,
        discountedPriceCents: it.discountedPriceCents,
        quantityAvailable: it.quantityAvailable,
        expiresAt: it.expiresAt,
        imageUrl: it.imageUrl ?? null,
        allergens: it.allergens ? { connect: it.allergens.map((a) => ({ name: a })) } : undefined,
      },
    });

    // Sync allergens on update
    if (it.allergens) {
      await prisma.item.update({
        where,
        data: {
          allergens: {
            set: [],
            connect: it.allergens.map((a) => ({ name: a })),
          },
        },
      });
    }
  }

  console.log(
    'Seed complete: diverse restaurants and items created (near-expiry, expired, sold-out, allergens).',
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
