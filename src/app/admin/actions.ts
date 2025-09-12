
'use server';
import 'server-only'

import { db } from '@/lib/db';
import { listingSubmissions, motorcycles, testimonials, type Motorcycle, type Testimonial } from '@/lib/db/schema';
import { desc, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { supabase } from '@/lib/supabase';

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

const motorcycleSchema = z.object({
  make: z.string().min(2),
  model: z.string().min(1),
  year: z.coerce.number(),
  price: z.coerce.number(),
  kmDriven: z.coerce.number(),
  engineDisplacement: z.coerce.number(),
  registration: z.string().min(2),
  condition: z.enum(['Excellent', 'Good', 'Fair', 'Poor']),
  description: z.string().min(10),
  images: z.array(z.string().url()).nullable(),
});

// Motorcycle Actions
export async function addMotorcycle(data: Omit<Motorcycle, 'id'>) {
    const validatedData = motorcycleSchema.parse(data);
    await db.insert(motorcycles).values(validatedData);
    revalidatePath('/admin');
    revalidatePath('/');
}

export async function updateMotorcycle(id: number, data: Omit<Motorcycle, 'id'>) {
    const validatedData = motorcycleSchema.parse(data);
    await db.update(motorcycles).set(validatedData).where(eq(motorcycles.id, id));
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
const testimonialSchema = z.object({
    name: z.string().min(2),
    location: z.string().min(2),
    review: z.string().min(10),
    rating: z.coerce.number().min(1).max(5),
    image: z.string().url().or(z.literal('')).nullable(),
});

export async function addTestimonial(data: Omit<Testimonial, 'id'>) {
    const validatedData = testimonialSchema.parse(data);
    const dataToInsert = {
        ...validatedData,
        image: validatedData.image || null
    }
    await db.insert(testimonials).values(dataToInsert);
    revalidatePath('/admin');
    revalidatePath('/');
}

export async function updateTestimonial(id: number, data: Omit<Testimonial, 'id'>) {
    const validatedData = testimonialSchema.parse(data);
    const dataToUpdate = {
        ...validatedData,
        image: validatedData.image || null
    }
    await db.update(testimonials).set(dataToUpdate).where(eq(testimonials.id, id));
    revalidatePath('/admin');
    revalidatePath('/');
}

export async function deleteTestimonial(id: number) {
    await db.delete(testimonials).where(eq(testimonials.id, id));
    revalidatePath('/admin');
    revalidatePath('/');
}


// Submission Actions
export async function approveAndAddMotorcycle(submissionId: number, data: Omit<Motorcycle, 'id'>) {
    const validatedData = motorcycleSchema.parse(data);
    
    // The neon-http driver doesn't support transactions. Run sequentially.
    await db.insert(motorcycles).values(validatedData);
    await db.delete(listingSubmissions).where(eq(listingSubmissions.id, submissionId));

    revalidatePath('/admin');
    revalidatePath('/');
}


export async function deleteSubmission(id: number) {
    const submissionToDelete = await db.select({images: listingSubmissions.images}).from(listingSubmissions).where(eq(listingSubmissions.id, id));
    
    if (submissionToDelete.length > 0 && submissionToDelete[0].images) {
        const imagePaths = submissionToDelete[0].images.map(url => new URL(url).pathname.split('/listings-images/')[1]);
        if (imagePaths.length > 0) {
            const { error: deleteError } = await supabase.storage.from('listings-images').remove(imagePaths);
            if (deleteError) {
                console.error("Supabase image deletion error:", deleteError);
                // Decide if you want to stop the process or just log the error
            }
        }
    }
    
    await db.delete(listingSubmissions).where(eq(listingSubmissions.id, id));
    revalidatePath('/admin');
}
