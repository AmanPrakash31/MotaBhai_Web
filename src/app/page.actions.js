
'use server';
import 'server-only'

import { db } from '@/lib/db';
import { motorcycles, testimonials } from '@/lib/db/schema';

export async function getMotorcycles() {
  const allMotorcycles = await db.select().from(motorcycles);
  return allMotorcycles;
}

export async function getTestimonials() {
  const allTestimonials = await db.select().from(testimonials);
  return allTestimonials;
}
