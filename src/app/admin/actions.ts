
'use server';
import 'server-only'

import { db } from '@/lib/db';
import { listingSubmissions, motorcycles, testimonials, type Motorcycle, type Testimonial } from '@/lib/db/schema';
import { desc, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { supabase } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';

async function uploadImages(images: File[], bucket: string): Promise<string[] | null> {
    const hasImages = images.some(file => file.size > 0);
    if (!hasImages) return null;

    const imageUrls: string[] = [];
    for (const image of images) {
        if (image.size > 0) {
            const fileExtension = image.name.split('.').pop();
            const fileName = `${uuidv4()}.${fileExtension}`;
            
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from(bucket)
                .upload(fileName, image);

            if (uploadError) {
                console.error(`Supabase upload error in bucket ${bucket}:`, uploadError);
                throw new Error('Failed to upload one or more images.');
            }

            const { data: publicUrlData } = supabase.storage
                .from(bucket)
                .getPublicUrl(uploadData.path);
            
            if (publicUrlData) {
                imageUrls.push(publicUrlData.publicUrl);
            }
        }
    }
    return imageUrls;
}

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

const motorcycleFormSchema = z.object({
  id: z.coerce.number().optional(),
  make: z.string().min(2),
  model: z.string().min(1),
  year: z.coerce.number(),
  price: z.coerce.number(),
  kmDriven: z.coerce.number(),
  engineDisplacement: z.coerce.number(),
  registration: z.string().min(2),
  condition: z.enum(['Excellent', 'Good', 'Fair', 'Poor']),
  description: z.string().min(10),
  existingImages: z.string().optional().transform(val => val ? val.split(',') : []),
});

export async function addMotorcycle(formData: FormData) {
    const rawData = Object.fromEntries(formData.entries());
    const validatedData = motorcycleFormSchema.parse(rawData);
    
    const newImages = formData.getAll('images') as File[];
    const newImageUrls = await uploadImages(newImages, 'listings-images') || [];
    
    const allImageUrls = [...newImageUrls];

    const dataToInsert = { ...validatedData, images: allImageUrls };
    
    await db.insert(motorcycles).values(dataToInsert);
    revalidatePath('/admin');
    revalidatePath('/');
}

export async function updateMotorcycle(formData: FormData) {
    const rawData = Object.fromEntries(formData.entries());
    const validatedData = motorcycleFormSchema.parse(rawData);
    const { id, existingImages, ...dataToUpdate } = validatedData;

    if (!id) throw new Error("Motorcycle ID is missing for update.");
    
    const newImages = formData.getAll('images') as File[];
    const newImageUrls = await uploadImages(newImages, 'listings-images') || [];

    const finalImages = [...(existingImages || []), ...newImageUrls];
    
    await db.update(motorcycles).set({ ...dataToUpdate, images: finalImages }).where(eq(motorcycles.id, id));
    revalidatePath('/admin');
    revalidatePath('/');
    revalidatePath(`/${id}`);
}


export async function deleteMotorcycle(id: number) {
    await db.delete(motorcycles).where(eq(motorcycles.id, id));
    revalidatePath('/admin');
    revalidatePath('/');
}


const testimonialFormSchema = z.object({
    id: z.coerce.number().optional(),
    name: z.string().min(2),
    location: z.string().min(2),
    review: z.string().min(10),
    rating: z.coerce.number().min(1).max(5),
    existingImage: z.string().optional(),
});

export async function addTestimonial(formData: FormData) {
    const rawData = Object.fromEntries(formData.entries());
    const validatedData = testimonialFormSchema.parse(rawData);

    const imageFile = formData.get('image') as File | null;
    let imageUrl: string | null = null;
    if (imageFile && imageFile.size > 0) {
        const urls = await uploadImages([imageFile], 'testimonials-images');
        imageUrl = urls ? urls[0] : null;
    }
    
    const { existingImage, ...dataToInsert } = validatedData;
    
    await db.insert(testimonials).values({ ...dataToInsert, image: imageUrl });
    revalidatePath('/admin');
    revalidatePath('/');
}

export async function updateTestimonial(formData: FormData) {
    const rawData = Object.fromEntries(formData.entries());
    const validatedData = testimonialFormSchema.parse(rawData);
    const { id, existingImage, ...dataToUpdate } = validatedData;
    if (!id) throw new Error("Testimonial ID is missing for update.");

    const imageFile = formData.get('image') as File | null;
    let imageUrl: string | null = existingImage || null;
    if (imageFile && imageFile.size > 0) {
        const urls = await uploadImages([imageFile], 'testimonials-images');
        imageUrl = urls ? urls[0] : null;
    }

    await db.update(testimonials).set({ ...dataToUpdate, image: imageUrl }).where(eq(testimonials.id, id));
    revalidatePath('/admin');
    revalidatePath('/');
}


export async function deleteTestimonial(id: number) {
    await db.delete(testimonials).where(eq(testimonials.id, id));
    revalidatePath('/admin');
    revalidatePath('/');
}


const approveMotorcycleSchema = motorcycleFormSchema.extend({
    submissionId: z.coerce.number(),
})

export async function approveAndAddMotorcycle(formData: FormData) {
    const rawData = Object.fromEntries(formData.entries());
    const validatedData = approveMotorcycleSchema.parse(rawData);
    const { submissionId, id, existingImages, ...dataToInsert } = validatedData;
    
    const newImages = formData.getAll('images') as File[];
    const newImageUrls = await uploadImages(newImages, 'listings-images') || [];

    const finalImages = [...(existingImages || []), ...newImageUrls];

    await db.insert(motorcycles).values({ ...dataToInsert, images: finalImages });
    await db.delete(listingSubmissions).where(eq(listingSubmissions.id, submissionId));

    revalidatePath('/admin');
    revalidatePath('/');
}

export async function deleteSubmission(id: number) {
    const submissionToDelete = await db.select({images: listingSubmissions.images}).from(listingSubmissions).where(eq(listingSubmissions.id, id));
    
    if (submissionToDelete.length > 0 && submissionToDelete[0].images) {
        const imagePaths = submissionToDelete[0].images.map(url => new URL(url).pathname.split('/listings-images/')[1]).filter(Boolean);
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

    