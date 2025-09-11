'use server';
import 'server-only'

import { suggestListingPrice, type SuggestListingPriceInput, type SuggestListingPriceOutput } from '@/ai/flows/suggest-listing-price';
import { z } from 'zod';
import { db } from '@/lib/db';
import { motorcycles } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';


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
  condition: z.enum(['Excellent', 'Good', 'Fair', 'Poor']),
  description: z.string().min(20),
  price: z.coerce.number(),
  // For now, we are not handling image uploads to the DB.
  // This can be added later with a file storage service.
  images: z.any().optional(),
});


export async function submitListing(data: unknown): Promise<{ success: boolean; error?: string }> {
    const validation = SubmitListingSchema.safeParse(data);
    if (!validation.success) {
      const errorMessages = validation.error.issues.map(issue => issue.message).join(', ');
      console.error("Validation failed:", errorMessages);
      return { success: false, error: errorMessages };
    }

    const { name, phone, location, ...motorcycleData } = validation.data;
    
    // In a real app, you might want to associate the seller with the listing.
    // For now, seller info is just passed through. The primary action is creating the motorcycle listing.

    try {
        await db.insert(motorcycles).values({
            ...motorcycleData,
            // Images are not being saved yet. Placeholder.
            images: ['https://picsum.photos/seed/new-listing/800/600'],
            // In a real app, you would handle registration info differently.
            registration: location.substring(0, 5) || 'N/A',
            engineDisplacement: 0, // Placeholder
        });

        // The emailjs logic will handle notifications
        return { success: true };

    } catch (error) {
        console.error("Database insertion error:", error);
        return { success: false, error: 'Failed to save the listing to the database.' };
    }
}
