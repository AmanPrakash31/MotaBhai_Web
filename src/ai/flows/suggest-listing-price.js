
'use server';

/**
 * @fileOverview This file defines a Genkit flow for suggesting a listing price for a motorcycle based on its attributes.
 *
 * - suggestListingPrice - A function that takes motorcycle details as input and returns a suggested listing price.
 * - SuggestListingPriceInput - The input type for the suggestListingPrice function.
 * - SuggestListingPriceOutput - The return type for the suggestListingPrice function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestListingPriceInputSchema = z.object({
  make: z.string().describe('The make of the motorcycle.'),
  model: z.string().describe('The model of the motorcycle.'),
  year: z.number().describe('The year the motorcycle was manufactured.'),
  condition: z
    .string()
    .describe(
      'The condition of the motorcycle (e.g., excellent, good, fair, poor).' // TODO: enum
    ),
  kmDriven: z.number().describe('The kilometers driven of the motorcycle.'),
});


const SuggestListingPriceOutputSchema = z.object({
  suggestedPrice: z
    .number()
    .describe('The suggested listing price for the motorcycle.'),
  reasoning: z
    .string()
    .describe('The reasoning behind the suggested listing price.'),
});


export async function suggestListingPrice(
  input
) {
  return suggestListingPriceFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestListingPricePrompt',
  input: {schema: SuggestListingPriceInputSchema},
  output: {schema: SuggestListingPriceOutputSchema},
  prompt: `You are an expert in motorcycle valuation. Based on the
  make, model, year, condition, and KM driven of the motorcycle, suggest a
  fair listing price. Also, provide a brief explanation of your reasoning.

  Make: {{{make}}}
  Model: {{{model}}}
  Year: {{{year}}}
  Condition: {{{condition}}}
  KM driven: {{{kmDriven}}}
  `,
});

const suggestListingPriceFlow = ai.defineFlow(
  {
    name: 'suggestListingPriceFlow',
    inputSchema: SuggestListingPriceInputSchema,
    outputSchema: SuggestListingPriceOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output;
  }
);
