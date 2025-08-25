import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

function slugify(str: string) {
    return str
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");
}

export async function POST(req: NextRequest) {
    try {
        const data = await req.json();

        if (!data.name || !data.address || !data.city || !data.country || !data.postcode) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const slug = slugify(data.name);
        console.log("SLUG USED:", slug);

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

        return NextResponse.json(restaurant, { status: 201 });
    } catch (error: any) {
        console.error("API ERROR:", error);
        return NextResponse.json({ error: error.message || String(error) }, { status: 500 });
    }
}

