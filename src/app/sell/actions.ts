
'use server';
import 'server-only'

import { suggestListingPrice, type SuggestListingPriceInput, type SuggestListingPriceOutput } from '@/ai/flows/suggest-listing-price';
import { z } from 'zod';
import { db } from '@/lib/db';
import { listingSubmissions } from '@/lib/db/schema';
import { redirect } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';


const ActionInputSchema = z.object({
  make: z.string().min(2, "Make is required"),
  model: z.string().min(1, "Model is required"),
  year: z.coerce.number().min(1900).max(new Date().getFullYear() + 1),
  condition: z.string().min(1, "Condition is required"),
  kmDriven: z.coerce.number().min(0),
});

export async function getSuggestedPrice(data: unknown): Promise<{ success: boolean; data?: SuggestListingPriceOutput; error?: string }> {
  const validation = ActionInputSchema.safeParse(data);
  if (!validation.success) {
    const errorMessages = validation.error.issues.map(issue => issue.message).join(', ');
    return { success: false, error: errorMessages };
  }
  
  try {
    const result = await suggestListingPrice(validation.data as SuggestListingPriceInput);
    return { success: true, data: result };
  } catch (error) {
    console.error('AI Price Suggestion Error:', error);
    return { success: false, error: 'An unexpected error occurred while contacting the AI.' };
  }
}

const SubmitListingSchema = z.object({
  name: z.string().min(2),
  phone: z.string().min(10),
  location: z.string().min(2),
  make: z.string().min(2),
  model: z.string().min(1),
  year: z.coerce.number(),
  kmDriven: z.coerce.number(),
  engineDisplacement: z.coerce.number(),
  registration: z.string().min(2),
  condition: z.enum(['Excellent', 'Good', 'Fair', 'Poor']),
  description: z.string().min(20),
  price: z.coerce.number(),
});


export async function submitListing(formData: FormData): Promise<{ success: boolean; error?: string, newSubmission?: any }> {
    const rawData = Object.fromEntries(formData.entries());
    
    // Remove file entries for validation with Zod
    const rawDataWithoutFiles: { [key: string]: any } = {};
    for (const key in rawData) {
        if (!(rawData[key] instanceof File)) {
            rawDataWithoutFiles[key] = rawData[key];
        }
    }

    const validation = SubmitListingSchema.safeParse(rawDataWithoutFiles);

    if (!validation.success) {
      const errorMessages = validation.error.issues.map(issue => issue.message).join(', ');
      console.error("Validation failed:", errorMessages);
      return { success: false, error: errorMessages };
    }

    const { ...submissionData } = validation.data;
    const uploadedImages = formData.getAll('images') as File[];
    const hasImages = uploadedImages.some(file => file.size > 0);
    let imageUrls: string[] | null = null;
    
    if (hasImages) {
        imageUrls = [];
        for (const image of uploadedImages) {
            if (image.size > 0) {
                const fileExtension = image.name.split('.').pop();
                const fileName = `${uuidv4()}.${fileExtension}`;
                
                const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
                    .from('listings-images')
                    .upload(fileName, image);

                if (uploadError) {
                    console.error("Supabase upload error:", uploadError);
                    return { success: false, error: 'Failed to upload one or more images.' };
                }

                const { data: publicUrlData } = supabaseAdmin.storage
                    .from('listings-images')
                    .getPublicUrl(uploadData.path);
                
                if (publicUrlData) {
                    imageUrls.push(publicUrlData.publicUrl);
                }
            }
        }
    }


    try {
        const newSubmissions = await db.insert(listingSubmissions).values({
            ...submissionData,
            images: imageUrls
        }).returning({
            id: listingSubmissions.id,
            submittedAt: listingSubmissions.submittedAt
        });

        if (newSubmissions.length > 0) {
          return { success: true, newSubmission: newSubmissions[0] };
        } else {
          return { success: false, error: 'Failed to retrieve new submission details.' };
        }

    } catch (error) {
        console.error("Database insertion error:", error);
        return { success: false, error: 'Failed to save the listing submission to the database.' };
    }
}

export async function navigateToSuccess() {
  redirect('/sell/success');
}
