import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/auth';

function slugify(str: string) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

export async function POST(req: NextRequest) {
  try {
    // Require authentication
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await req.json();

    if (!data.name || !data.address) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const slug = slugify(data.name);
    console.log('SLUG USED:', slug);

    const restaurant = await prisma.restaurant.upsert({
      where: { slug },
      update: {
        name: data.name,
        address: data.address,
        city: data.city,
        country: data.country,
        postcode: data.postcode,
        latitude: data.latitude ? parseFloat(data.latitude) : undefined,
        timezone: data.timezone,
        phone: data.phone,
        email: data.email,
        description: data.description,
        imageUrl: data.imageUrl,
      },
      create: {
        name: data.name,
        slug,
        address: data.address,
        city: data.city,
        country: data.country,
        postcode: data.postcode,
        latitude: data.latitude ? parseFloat(data.latitude) : undefined,
        timezone: data.timezone,
        phone: data.phone,
        email: data.email,
        description: data.description,
        imageUrl: data.imageUrl,
      },
    });

    // Ensure the creator is recorded as an OWNER member of this restaurant
    // Ensure membership exists (manual upsert because of composite unique key)
    const existing = await prisma.restaurantMember.findFirst({
      where: { userId, restaurantId: restaurant.id },
    });
    if (!existing) {
      await prisma.restaurantMember.create({
        data: { userId, restaurantId: restaurant.id, role: 'OWNER' },
      });
    }

    return NextResponse.json(restaurant, { status: 201 });
  } catch (error: any) {
    console.error('API ERROR:', error);
    return NextResponse.json({ error: error.message || String(error) }, { status: 500 });
  }
}
