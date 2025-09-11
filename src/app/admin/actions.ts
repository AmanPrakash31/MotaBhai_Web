'use server';
import 'server-only'

import { db } from '@/lib/db';
import { listingSubmissions, motorcycles, testimonials } from '@/lib/db/schema';
import { desc } from 'drizzle-orm';

export async function getSubmissions() {
  const allSubmissions = await db.select().from(listingSubmissions).orderBy(desc(listingSubmissions.submittedAt));
  return allSubmissions;
}

export async function getMotorcycleListings() {
    const allMotorcycles = await db.select().from(motorcycles).orderBy(desc(motorcycles.id));
    return allMotorcycles;
}

export async function getTestimonialsList() {
    const allTestimonials = await db.select().from(testimonials).orderBy(desc(testimonials.id));
    return allTestimonials;
}
