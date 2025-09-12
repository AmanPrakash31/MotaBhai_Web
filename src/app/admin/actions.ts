
'use server';
import 'server-only'

import { db } from '@/lib/db';
import { listingSubmissions, motorcycles, testimonials, type Motorcycle, type Testimonial } from '@/lib/db/schema';
import { desc, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';

async function uploadImages(images: File[], bucket: string): Promise<string[]> {
    if (!images || images.length === 0 || images.every(file => file.size === 0)) return [];

    const imageUrls: string[] = [];
    for (const image of images) {
        if (image.size > 0) {
            const fileExtension = image.name.split('.').pop();
            const fileName = `${uuidv4()}.${fileExtension}`;
            
            const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
                .from(bucket)
                .upload(fileName, image);

            if (uploadError) {
                console.error(`Supabase upload error in bucket ${bucket}:`, uploadError);
                throw new Error('Failed to upload one or more images.');
            }

            const { data: publicUrlData } = supabaseAdmin.storage
                .from(bucket)
                .getPublicUrl(uploadData.path);
            
            if (publicUrlData) {
                imageUrls.push(publicUrlData.publicUrl);
            }
        }
    }
    return imageUrls;
}

async function deleteImages(urls: string[], bucket: string) {
    if (!urls || urls.length === 0) return;
    const fileNames = urls.map(url => new URL(url).pathname.split(`/${bucket}/`)[1]).filter(Boolean);
    if (fileNames.length > 0) {
        const { error } = await supabaseAdmin.storage.from(bucket).remove(fileNames);
        if (error) {
            console.error(`Supabase image deletion error in bucket ${bucket}:`, error);
            // Decide if we should throw or just log. For now, just log.
        }
    }
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
  existingImages: z.string().optional().transform(val => val ? val.split(',').filter(Boolean) : []),
});

export async function addMotorcycle(formData: FormData) {
    const rawData = Object.fromEntries(formData.entries());
    const validatedData = motorcycleFormSchema.parse(rawData);
    
    const newImages = formData.getAll('images') as File[];
    const newImageUrls = await uploadImages(newImages, 'listings-images');
    
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
    
    const listingBeforeUpdate = await db.query.motorcycles.findFirst({ where: eq(motorcycles.id, id) });
    const originalImages = listingBeforeUpdate?.images || [];

    const newImages = formData.getAll('images') as File[];
    const newImageUrls = await uploadImages(newImages, 'listings-images');
    
    const finalImages = [...(existingImages || []), ...newImageUrls];
    
    // Determine which images were removed to delete them from storage
    const imagesToDelete = originalImages.filter(img => !finalImages.includes(img));
    await deleteImages(imagesToDelete, 'listings-images');

    await db.update(motorcycles).set({ ...dataToUpdate, images: finalImages }).where(eq(motorcycles.id, id));
    revalidatePath('/admin');
    revalidatePath('/');
    revalidatePath(`/${id}`);
}


export async function deleteMotorcycle(id: number) {
    const listingToDelete = await db.query.motorcycles.findFirst({ where: eq(motorcycles.id, id) });
    if (listingToDelete?.images) {
        await deleteImages(listingToDelete.images, 'listings-images');
    }

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

    const testimonialBeforeUpdate = await db.query.testimonials.findFirst({ where: eq(testimonials.id, id) });
    const originalImage = testimonialBeforeUpdate?.image;

    const imageFile = formData.get('image') as File | null;
    let newImageUrl: string | null = existingImage || null;
    
    if (imageFile && imageFile.size > 0) {
        const urls = await uploadImages([imageFile], 'testimonials-images');
        newImageUrl = urls ? urls[0] : null;
    }

    // If original image existed and the new one is different (or null), delete the old one.
    if (originalImage && originalImage !== newImageUrl) {
        await deleteImages([originalImage], 'testimonials-images');
    }

    await db.update(testimonials).set({ ...dataToUpdate, image: newImageUrl }).where(eq(testimonials.id, id));
    revalidatePath('/admin');
    revalidatePath('/');
}


export async function deleteTestimonial(id: number) {
    const testimonialToDelete = await db.query.testimonials.findFirst({ where: eq(testimonials.id, id) });
    if (testimonialToDelete?.image) {
        await deleteImages([testimonialToDelete.image], 'testimonials-images');
    }
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
    
    const submissionBeforeApproval = await db.query.listingSubmissions.findFirst({ where: eq(listingSubmissions.id, submissionId) });
    const originalSubmissionImages = submissionBeforeApproval?.images || [];

    const newImages = formData.getAll('images') as File[];
    const newImageUrls = await uploadImages(newImages, 'listings-images');

    const finalImages = [...(existingImages || []), ...newImageUrls];

    // Some images from the submission might have been removed during approval.
    // We don't delete them here, we just don't add them to the final listing.
    // The original submission record with its images will be deleted.
    // If an image from submission was removed AND it's not in finalImages, it should be deleted.
    const imagesToDelete = originalSubmissionImages.filter(img => !finalImages.includes(img));
    await deleteImages(imagesToDelete, 'listings-images');

    await db.insert(motorcycles).values({ ...dataToInsert, images: finalImages });
    await db.delete(listingSubmissions).where(eq(listingSubmissions.id, submissionId));

    revalidatePath('/admin');
    revalidatePath('/');
}

export async function deleteSubmission(id: number) {
    const submissionToDelete = await db.query.listingSubmissions.findFirst({ where: eq(listingSubmissions.id, id) });
    
    if (submissionToDelete && submissionToDelete.images) {
        await deleteImages(submissionToDelete.images, 'listings-images');
    }
    
    await db.delete(listingSubmissions).where(eq(listingSubmissions.id, id));
    revalidatePath('/admin');
}
