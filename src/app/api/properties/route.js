import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const properties = await prisma.property.findMany({
    where: { orgId: session.user.orgId },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json({ properties });
}

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const property = await prisma.property.create({
    data: {
      title: body.title, location: body.location, city: body.city || null,
      price: body.price, type: body.type || 'apartment',
      bedrooms: body.bedrooms || null, bathrooms: body.bathrooms || null,
      area: body.area || null, areaUnit: body.areaUnit || 'sqft',
      availability: body.availability || 'available',
      description: body.description || null,
      images: body.images ? JSON.stringify(body.images) : null,
      orgId: session.user.orgId,
    },
  });
  return NextResponse.json({ property }, { status: 201 });
}
