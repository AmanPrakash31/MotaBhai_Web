'use server';

import { suggestListingPrice, type SuggestListingPriceInput, type SuggestListingPriceOutput } from '@/ai/flows/suggest-listing-price';
import { z } from 'zod';
import nodemailer from 'nodemailer';

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
  
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_SERVER_USER,
      pass: process.env.EMAIL_SERVER_PASSWORD,
    },
  });

  try {
    const emailHtml = `
      <h1>New Motorcycle Listing Submission</h1>
      <p>A new motorcycle has been submitted for listing on the website. Please review the details below.</p>
      <h2>Motorcycle Details</h2>
      <ul>
        <li><strong>Make:</strong> ${make}</li>
        <li><strong>Model:</strong> ${model}</li>
        <li><strong>Year:</strong> ${year}</li>
        <li><strong>Mileage:</strong> ${mileage} km</li>
        <li><strong>Condition:</strong> ${condition}</li>
        <li><strong>Asking Price:</strong> ₹${price}</li>
      </ul>
      <h2>Description</h2>
      <p>${description}</p>
      <p>The uploaded images are attached to this email.</p>
    `;
    
    const attachments = await Promise.all(images.map(async (file: File) => ({
      filename: file.name,
      content: Buffer.from(await file.arrayBuffer()),
      contentType: file.type,
    })));

    await transporter.sendMail({
      from: `"Mota Bhai Website" <${process.env.EMAIL_SERVER_USER}>`,
      to: process.env.EMAIL_TO,
      subject: `New Bike Listing: ${year} ${make} ${model}`,
      html: emailHtml,
      attachments: attachments,
    });
    
    return { success: true };
  } catch (error) {
    console.error('Listing Submission/Email Error:', error);
    return { success: false, error: 'An unexpected error occurred while submitting the listing. Please try again later.' };
  }
}
