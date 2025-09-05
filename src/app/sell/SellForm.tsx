'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useState, useTransition } from 'react';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { getSuggestedPrice } from './actions';
import { Loader2, Wand2 } from 'lucide-react';
import type { SuggestListingPriceOutput } from '@/ai/flows/suggest-listing-price';


const formSchema = z.object({
  make: z.string().min(2, "Make must be at least 2 characters."),
  model: z.string().min(1, "Model is required."),
  year: z.coerce.number().min(1900, "Please enter a valid year.").max(new Date().getFullYear() + 1, "Year cannot be in the future."),
  mileage: z.coerce.number().min(0, "Mileage must be a positive number."),
  condition: z.enum(['Excellent', 'Good', 'Fair', 'Poor']),
  description: z.string().min(20, "Description must be at least 20 characters.").max(500, "Description cannot exceed 500 characters."),
  price: z.coerce.number().min(1, "Please enter a valid price."),
  images: z.any().optional(),
});

export default function SellForm() {
  const [isAiPending, startAiTransition] = useTransition();
  const [suggestion, setSuggestion] = useState<SuggestListingPriceOutput | null>(null);
  const [isSuggestionOpen, setIsSuggestionOpen] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      make: '',
      model: '',
      year: undefined,
      mileage: undefined,
      description: '',
      price: undefined,
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values);
    toast({
      title: "Listing Submitted!",
      description: "Your motorcycle has been submitted for review.",
    });
    form.reset();
  }

  const handleSuggestPrice = () => {
    const values = form.getValues();
    const { make, model, year, mileage, condition } = values;

    if (!make || !model || !year || mileage === undefined || !condition) {
      toast({
        variant: 'destructive',
        title: 'Missing Information',
        description: 'Please fill out Make, Model, Year, Mileage, and Condition to get a price suggestion.',
      });
      return;
    }
    
    startAiTransition(async () => {
      const result = await getSuggestedPrice({ make, model, year, mileage, condition });
      if (result.success && result.data) {
        setSuggestion(result.data);
        setIsSuggestionOpen(true);
      } else {
        toast({
          variant: 'destructive',
          title: 'AI Error',
          description: result.error || 'Could not generate a price suggestion.',
        });
      }
    });
  };

  return (
    <>
      <Card>
        <CardContent className="p-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <FormField control={form.control} name="make" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Make</FormLabel>
                    <FormControl><Input placeholder="e.g., Harley-Davidson" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="model" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Model</FormLabel>
                    <FormControl><Input placeholder="e.g., Iron 883" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="year" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Year</FormLabel>
                    <FormControl><Input type="number" placeholder="e.g., 2021" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="mileage" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mileage</FormLabel>
                    <FormControl><Input type="number" placeholder="e.g., 3500" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="condition" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Condition</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select condition" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {['Excellent', 'Good', 'Fair', 'Poor'].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="price" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your Listing Price</FormLabel>
                    <FormControl><Input type="number" placeholder="e.g., 9500" {...field} /></FormControl>
                    <FormDescription>Enter your desired selling price.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <Button type="button" variant="outline" onClick={handleSuggestPrice} disabled={isAiPending}>
                {isAiPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Wand2 className="mr-2 h-4 w-4" />
                )}
                Suggest a Price with AI
              </Button>
              
              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl><Textarea placeholder="Tell us about your motorcycle..." {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              
              <FormField control={form.control} name="images" render={({ field }) => (
                <FormItem>
                  <FormLabel>Upload Images</FormLabel>
                  <FormControl><Input type="file" multiple {...field} /></FormControl>
                  <FormDescription>High-quality images help your listing sell faster.</FormDescription>
                  <FormMessage />
                </FormItem>
              )} />
              
              <Button type="submit" size="lg" className="w-full">Submit Listing</Button>
            </form>
          </Form>
        </CardContent>
      </Card>
      <Dialog open={isSuggestionOpen} onOpenChange={setIsSuggestionOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center"><Wand2 className="mr-2 h-5 w-5 text-primary"/> AI Price Suggestion</DialogTitle>
            <DialogDescription>
              Based on the details you provided, here is our AI's suggestion for your listing.
            </DialogDescription>
          </DialogHeader>
          {suggestion && (
            <div className="py-4">
              <p className="text-center text-4xl font-bold text-primary mb-4">${suggestion.suggestedPrice.toLocaleString()}</p>
              <h4 className="font-semibold mt-6 mb-2">Reasoning:</h4>
              <p className="text-sm text-muted-foreground bg-secondary p-3 rounded-md">{suggestion.reasoning}</p>
            </div>
          )}
          <Button onClick={() => {
            if (suggestion) form.setValue('price', suggestion.suggestedPrice);
            setIsSuggestionOpen(false);
          }}>Use this Price</Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
