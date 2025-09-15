
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useState, useTransition, useRef } from "react";
import emailjs from "@emailjs/browser";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { getSuggestedPrice, submitListing, navigateToSuccess } from './actions';
import { Loader2, Wand2 } from 'lucide-react';


const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  phone: z
    .string()
    .min(10, "Please enter a valid 10-digit phone number.")
    .max(15, "Phone number is too long."),
  location: z.string().min(2, "Location must be at least 2 characters."),
  make: z.string().min(2, "Make must be at least 2 characters."),
  model: z.string().min(1, "Model is required."),
  year: z.coerce
    .number()
    .min(1900, "Please enter a valid year.")
    .max(new Date().getFullYear() + 1, "Year cannot be in the future."),
  kmDriven: z.coerce.number().min(0, "KM driven must be a positive number."),
  engineDisplacement: z.coerce.number().min(50, "Engine CC is required."),
  registration: z.string().min(2, "Registration is required."),
  condition: z.enum(["Excellent", "Good", "Fair", "Poor"]),
  description: z
    .string()
    .min(20, "Description must be at least 20 characters.")
    .max(500, "Description cannot exceed 500 characters."),
  price: z.coerce.number().min(1, "Please enter a valid price."),
  images: z.custom().optional(),
});

export default function SellForm() {
  const [isAiPending, startAiTransition] = useTransition();
  const [isSubmitPending, startSubmitTransition] = useTransition();
  const [suggestion, setSuggestion] =
    useState(null);
  const [isSuggestionOpen, setIsSuggestionOpen] = useState(false);
  const { toast } = useToast();
  const formRef = useRef(null);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      phone: "",
      location: "",
      make: "",
      model: "",
      year: '',
      kmDriven: '',
      engineDisplacement: '',
      registration: "",
      description: "",
      price: '',
    },
  });

  const sendEmail = async (submissionDetails) => {
      const serviceId = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID;
      const templateId = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID;
      const publicKey = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY;
      
      if (serviceId && templateId && publicKey) {
        try {
          await emailjs.send(serviceId, templateId, submissionDetails, publicKey);
          console.log('Submission email sent via EmailJS.');
        } catch (error) {
          console.error('EmailJS Error:', error);
        }
      }
  }

  async function onSubmit(values) {
    startSubmitTransition(async () => {
      if (!formRef.current) return;

      const formData = new FormData(formRef.current);
      const result = await submitListing(formData);

      if (result.success && result.newSubmission) {
        
        // Combine form values with new submission details for the email
        const emailParams = {
            ...values,
            ...result.newSubmission,
            submittedAt: new Date(result.newSubmission.submittedAt).toLocaleString(),
        };

        await sendEmail(emailParams);
        
        await navigateToSuccess();

      } else {
        toast({
            variant: 'destructive',
            title: 'Submission Error',
            description: result.error || 'Could not submit your listing.',
        });
      }
    });
  }

  const handleSuggestPrice = () => {
    const values = form.getValues();
    const { make, model, year, kmDriven, condition } = values;

    if (!make || !model || !year || kmDriven === undefined || !condition) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description:
          "Please fill out Make, Model, Year, KM driven, and Condition to get a price suggestion.",
      });
      return;
    }

    startAiTransition(async () => {
      const result = await getSuggestedPrice({
        make,
        model,
        year,
        kmDriven,
        condition,
      });
      if (result.success && result.data) {
        setSuggestion(result.data);
        setIsSuggestionOpen(true);
      } else {
        toast({
          variant: "destructive",
          title: "AI Error",
          description: result.error || "Could not generate a price suggestion.",
        });
      }
    });
  };

  const fileRef = form.register("images");

  const formatter = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
  });

  return (
    <>
      <Card>
        <CardContent className="p-8">
          <Form {...form}>
            <form
              ref={formRef}
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-8"
            >
              <div className="space-y-4">
                <CardHeader className="p-0 mb-4">
                  <CardTitle>Your Contact Details</CardTitle>
                </CardHeader>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Rohan Kumar" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input
                            type="tel"
                            placeholder="e.g., 9876543210"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Your Location</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Muzaffarpur" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t">
                <CardHeader className="p-0 mb-4">
                  <CardTitle>Motorcycle Details</CardTitle>
                </CardHeader>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <FormField
                    control={form.control}
                    name="make"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Make</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Royal Enfield" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="model"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Model</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Classic 350" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="year"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Year</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="e.g., 2021"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="kmDriven"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>KM driven</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="e.g., 8500"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="engineDisplacement"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Engine (CC)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="e.g., 350"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="registration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Registration</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., BR 05"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="condition"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Condition</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select condition" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {["Excellent", "Good", "Fair", "Poor"].map((c) => (
                              <SelectItem key={c} value={c}>
                                {c}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <input
                          type="hidden"
                          name="condition"
                          value={field.value || ""}
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Your Listing Price (in ₹)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="e.g., 180000"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Enter your desired selling price in INR.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={handleSuggestPrice}
                disabled={isAiPending}
              >
                {isAiPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Wand2 className="mr-2 h-4 w-4" />
                )}
                Suggest a Price with AI
              </Button>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Tell us about your motorcycle..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="images"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Upload Images (Optional)</FormLabel>
                    <FormControl><Input type="file" multiple {...fileRef} /></FormControl>
                    <FormDescription>High-quality images help your listing sell faster. You can upload multiple images.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={isSubmitPending}
              >
                {isSubmitPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Submit Listing
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
      <Dialog open={isSuggestionOpen} onOpenChange={setIsSuggestionOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Wand2 className="mr-2 h-5 w-5 text-primary" /> AI Price
              Suggestion
            </DialogTitle>
            <DialogDescription>
              Based on the details you provided, here is our AI's suggestion for
              your listing.
            </DialogDescription>
          </DialogHeader>
          {suggestion && (
            <div className="py-4">
              <p className="text-center text-4xl font-bold text-primary mb-4">
                {formatter.format(suggestion.suggestedPrice)}
              </p>
              <h4 className="font-semibold mt-6 mb-2">Reasoning:</h4>
              <p className="text-sm text-muted-foreground bg-secondary p-3 rounded-md">
                {suggestion.reasoning}
              </p>
            </div>
          )}
          <Button
            onClick={() => {
              if (suggestion) form.setValue("price", suggestion.suggestedPrice);
              setIsSuggestionOpen(false);
            }}
          >
            Use this Price
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
