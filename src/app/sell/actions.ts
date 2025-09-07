'use server';

import { suggestListingPrice, type SuggestListingPriceInput, type SuggestListingPriceOutput } from '@/ai/flows/suggest-listing-price';
import { z } from 'zod';

const ActionInputSchema = z.object({
  make: z.string().min(2, "Make is required"),
  model: z.string().min(1, "Model is required"),
  year: z.coerce.number().min(1900).max(new Date().getFullYear() + 1),
  condition: z.string().min(1, "Condition is required"),
  mileage: z.coerce.number().min(0),
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
    // This could be a more user-friendly error message.
    return { success: false, error: 'An unexpected error occurred while contacting the AI.' };
  }
}

const SubmitListingSchema = z.object({
  make: z.string(),
  model: z.string(),
  year: z.string(),
  mileage: z.string(),
  condition: z.string(),
  description: z.string(),
  price: z.string(),
  images: z.array(z.instanceof(File)),
});

export async function submitListing(formData: FormData): Promise<{ success: boolean; error?: string }> {
  
  const rawData = {
    make: formData.get('make'),
    model: formData.get('model'),
    year: formData.get('year'),
    mileage: formData.get('mileage'),
    condition: formData.get('condition'),
    description: formData.get('description'),
    price: formData.get('price'),
    images: formData.getAll('images'),
  }
  
  const validation = SubmitListingSchema.safeParse(rawData);

  if (!validation.success) {
    const errorMessages = validation.error.issues.map(issue => issue.message).join(', ');
    return { success: false, error: errorMessages };
  }

  const { make, model, year, mileage, condition, description, price, images } = validation.data;

  try {
    // TODO: Implement your email sending logic here.
    // You can use a service like Nodemailer, SendGrid, or Resend.
    // Example using a fictional email service:
    /*
    
    import { sendEmail } from '@/lib/email'; // This is a fictional module

    const emailHtml = `
      <h1>New Motorcycle Listing</h1>
      <p><strong>Make:</strong> ${make}</p>
      <p><strong>Model:</strong> ${model}</p>
      <p><strong>Year:</strong> ${year}</p>
      <p><strong>Mileage:</strong> ${mileage} km</p>
      <p><strong>Condition:</strong> ${condition}</p>
      <p><strong>Price:</strong> ₹${price}</p>
      <p><strong>Description:</strong> ${description}</p>
    `;

    const attachments = await Promise.all(images.map(async (file) => ({
      filename: file.name,
      content: Buffer.from(await file.arrayBuffer()),
    })));

    await sendEmail({
      to: 'motabhaiautomobile@gmail.com',
      subject: `New Listing: ${make} ${model}`,
      html: emailHtml,
      attachments: attachments,
    });
    */
    
    console.log('Form data processed and ready to be sent via email:', validation.data);


    return { success: true };
  } catch (error) {
    console.error('Listing Submission Error:', error);
    return { success: false, error: 'An unexpected error occurred while submitting the listing.' };
  }
}
