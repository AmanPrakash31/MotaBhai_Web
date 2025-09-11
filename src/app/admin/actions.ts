'use server';
import 'server-only'

import { db } from '@/lib/db';
import { listingSubmissions, motorcycles, testimonials, type Motorcycle, type Testimonial, type ListingSubmission } from '@/lib/db/schema';
import { desc, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

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

// --- CRUD Actions ---

// Motorcycle Actions
export async function addMotorcycle(data: Omit<Motorcycle, 'id'>) {
    await db.insert(motorcycles).values(data);
    revalidatePath('/admin');
    revalidatePath('/');
}

export async function updateMotorcycle(id: number, data: Omit<Motorcycle, 'id'>) {
    await db.update(motorcycles).set(data).where(eq(motorcycles.id, id));
    revalidatePath('/admin');
    revalidatePath('/');
    revalidatePath(`/${id}`);
}

export async function deleteMotorcycle(id: number) {
    await db.delete(motorcycles).where(eq(motorcycles.id, id));
    revalidatePath('/admin');
    revalidatePath('/');
}


// Testimonial Actions
export async function addTestimonial(data: Omit<Testimonial, 'id'>) {
    await db.insert(testimonials).values(data);
    revalidatePath('/admin');
    revalidatePath('/');
}

export async function updateTestimonial(id: number, data: Omit<Testimonial, 'id'>) {
    await db.update(testimonials).set(data).where(eq(testimonials.id, id));
    revalidatePath('/admin');
    revalidatePath('/');
}

export async function deleteTestimonial(id: number) {
    await db.delete(testimonials).where(eq(testimonials.id, id));
    revalidatePath('/admin');
    revalidatePath('/');
}


// Submission Actions
export async function approveSubmission(submission: ListingSubmission) {
    const { name, phone, location, images, submittedAt, id, ...motorcycleData } = submission;
    
    await db.transaction(async (tx) => {
        await tx.insert(motorcycles).values({
            ...motorcycleData,
            images: images || [],
        });
        await tx.delete(listingSubmissions).where(eq(listingSubmissions.id, id));
    });

    revalidatePath('/admin');
    revalidatePath('/');
}

export async function deleteSubmission(id: number) {
    await db.delete(listingSubmissions).where(eq(listingSubmissions.id, id));
    revalidatePath('/admin');
}
