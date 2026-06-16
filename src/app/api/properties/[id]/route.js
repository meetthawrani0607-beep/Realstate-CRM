import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const property = await prisma.property.findUnique({ where: { id: params.id } });
  if (!property || property.orgId !== session.user.orgId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  return NextResponse.json({ property });
}

export async function PATCH(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const existing = await prisma.property.findUnique({ where: { id: params.id } });
  if (!existing || existing.orgId !== session.user.orgId) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Prevent Mass Assignment: explicitly filter allowed fields
  const allowedFields = ['title', 'description', 'price', 'type', 'status', 'bedrooms', 'bathrooms', 'area', 'address', 'city', 'locality', 'features', 'images'];
  const updateData = {};
  for (const field of allowedFields) {
    if (body[field] !== undefined) updateData[field] = body[field];
  }

  const property = await prisma.property.update({ where: { id: params.id }, data: updateData });
  return NextResponse.json({ property });
}

export async function DELETE(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const existing = await prisma.property.findUnique({ where: { id: params.id } });
  if (!existing || existing.orgId !== session.user.orgId) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await prisma.property.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
