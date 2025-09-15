
'use server';
import 'server-only'

import { db } from '@/lib/db';
import { listingSubmissions, motorcycles, testimonials } from '@/lib/db/schema';
import { desc, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';

async function uploadImages(images, bucket) {
    if (!images || images.length === 0 || images.every(file => file.size === 0)) return [];

    const imageUrls = [];
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

async function deleteImages(urls, bucket) {
    if (!urls || urls.length === 0) return;
    const fileNames = urls.map(url => {
        try {
            // Ensure we are only trying to delete files from our own supabase storage
             const urlObject = new URL(url);
             const supabaseUrl = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL);
             if (urlObject.hostname !== supabaseUrl.hostname) return null;
            return urlObject.pathname.split(`/${bucket}/`)[1];
        } catch (e) {
            console.error(`Invalid URL format, cannot delete: ${url}`);
            return null;
        }
    }).filter((name) => name !== null && name !== '');


    if (fileNames.length > 0) {
        const { error } = await supabaseAdmin.storage.from(bucket).remove(fileNames);
        if (error) {
            console.error(`Supabase image deletion error in bucket ${bucket}:`, error);
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
  existingImages: z.preprocess(val => {
    if (typeof val === 'string' && val) return val.split(',');
    if (Array.isArray(val)) return val;
    return [];
  }, z.array(z.string())),
});

export async function addMotorcycle(formData) {
    const rawData = Object.fromEntries(formData.entries());
    const validatedData = motorcycleFormSchema.parse(rawData);
    
    const newImages = formData.getAll('images');
    const newImageUrls = await uploadImages(newImages, 'listings-images');
    
    const allImageUrls = [...validatedData.existingImages, ...newImageUrls];

    const { existingImages, id, ...dataToInsert } = validatedData;
    
    const payload = {
        ...dataToInsert,
        images: allImageUrls,
    };
    
    await db.insert(motorcycles).values(payload);
    revalidatePath('/admin');
    revalidatePath('/');
}

export async function updateMotorcycle(formData) {
    const rawData = Object.fromEntries(formData.entries());
    const validatedData = motorcycleFormSchema.parse(rawData);
    const { id, existingImages, ...dataToUpdate } = validatedData;

    if (!id) throw new Error("Motorcycle ID is missing for update.");
    
    const listingBeforeUpdate = await db.query.motorcycles.findFirst({ where: eq(motorcycles.id, id) });
    const originalImages = listingBeforeUpdate?.images || [];

    const newImages = formData.getAll('images');
    const newImageUrls = await uploadImages(newImages, 'listings-images');
    
    const finalImages = [...existingImages, ...newImageUrls];
    
    const imagesToDelete = originalImages.filter(img => !finalImages.includes(img));
    await deleteImages(imagesToDelete, 'listings-images');

    const payload = {
        ...dataToUpdate,
        images: finalImages,
    };

    await db.update(motorcycles).set(payload).where(eq(motorcycles.id, id));
    revalidatePath('/admin');
    revalidatePath('/');
    revalidatePath(`/${id}`);
}


export async function deleteMotorcycle(id) {
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
    existingImage: z.string().optional().transform(val => val || null),
});

export async function addTestimonial(formData) {
    const rawData = Object.fromEntries(formData.entries());
    const validatedData = testimonialFormSchema.parse(rawData);

    const imageFile = formData.get('image');
    let imageUrl = null;
    if (imageFile && imageFile.size > 0) {
        const urls = await uploadImages([imageFile], 'testimonials-images');
        imageUrl = urls.length > 0 ? urls[0] : null;
    }
    
    const { existingImage, id, ...dataToInsert } = validatedData;
    
    const payload = {
        ...dataToInsert,
        image: imageUrl,
    };
    
    await db.insert(testimonials).values(payload);
    revalidatePath('/admin');
    revalidatePath('/');
}

export async function updateTestimonial(formData) {
    const rawData = Object.fromEntries(formData.entries());
    const validatedData = testimonialFormSchema.parse(rawData);
    const { id, existingImage, ...dataToUpdate } = validatedData;
    if (!id) throw new Error("Testimonial ID is missing for update.");

    const testimonialBeforeUpdate = await db.query.testimonials.findFirst({ where: eq(testimonials.id, id) });
    const originalImage = testimonialBeforeUpdate?.image;

    const imageFile = formData.get('image');
    let newImageUrl = existingImage;
    
    if (imageFile && imageFile.size > 0) {
        const urls = await uploadImages([imageFile], 'testimonials-images');
        newImageUrl = urls.length > 0 ? urls[0] : null;
        if (originalImage && originalImage !== newImageUrl) {
            await deleteImages([originalImage], 'testimonials-images');
        }
    } else if (originalImage && !newImageUrl) {
        await deleteImages([originalImage], 'testimonials-images');
    }

    const payload = {
        ...dataToUpdate,
        image: newImageUrl,
    };

    await db.update(testimonials).set(payload).where(eq(testimonials.id, id));
    revalidatePath('/admin');
    revalidatePath('/');
}


export async function deleteTestimonial(id) {
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

export async function approveAndAddMotorcycle(formData) {
    const rawData = Object.fromEntries(formData.entries());
    const validatedData = approveMotorcycleSchema.parse(rawData);
    const { submissionId, id, existingImages, ...dataToInsert } = validatedData;
    
    const submissionBeforeApproval = await db.query.listingSubmissions.findFirst({ where: eq(listingSubmissions.id, submissionId) });
    if (!submissionBeforeApproval) throw new Error("Submission not found");

    const originalSubmissionImages = submissionBeforeApproval.images || [];

    const newImages = formData.getAll('images');
    const newImageUrls = await uploadImages(newImages, 'listings-images');

    const finalImages = [...existingImages, ...newImageUrls];

    const imagesToDelete = originalSubmissionImages.filter(img => !finalImages.includes(img));
    await deleteImages(imagesToDelete, 'listings-images');

    const payload = {
        ...dataToInsert,
        images: finalImages
    };

    await db.insert(motorcycles).values(payload);
    await db.delete(listingSubmissions).where(eq(listingSubmissions.id, submissionId));

    revalidatePath('/admin');
    revalidatePath('/');
}

export async function deleteSubmission(id) {
    const submissionToDelete = await db.query.listingSubmissions.findFirst({ where: eq(listingSubmissions.id, id) });
    
    if (submissionToDelete && submissionToDelete.images) {
        await deleteImages(submissionToDelete.images, 'listings-images');
    }
    
    await db.delete(listingSubmissions).where(eq(listingSubmissions.id, id));
    revalidatePath('/admin');
}
