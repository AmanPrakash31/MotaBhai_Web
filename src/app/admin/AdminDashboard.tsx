
'use client';

import { useState, useEffect, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { getSubmissions, getMotorcycleListings, getTestimonialsList, deleteSubmission, deleteMotorcycle, deleteTestimonial, addMotorcycle, updateMotorcycle, addTestimonial, updateTestimonial, approveAndAddMotorcycle } from './actions';
import type { ListingSubmission, Motorcycle, Testimonial } from '@/lib/db/schema';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import Image from 'next/image';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2, PlusCircle, Trash2, Pencil, CheckCircle, X } from 'lucide-react';

const passwordSchema = z.object({
  password: z.string().min(1, 'Password is required.'),
});

const motorcycleSchema = z.object({
  id: z.number().optional(),
  make: z.string().min(2, "Make is required"),
  model: z.string().min(1, "Model is required"),
  year: z.coerce.number().min(1900),
  price: z.coerce.number().min(1),
  kmDriven: z.coerce.number().min(0),
  engineDisplacement: z.coerce.number().min(50),
  registration: z.string().min(2, "Registration is required"),
  condition: z.enum(['Excellent', 'Good', 'Fair', 'Poor']),
  description: z.string().min(10, "Description is required"),
  images: z.custom<FileList>().optional(),
  existingImages: z.array(z.string()).optional(),
  // Used only for the approval flow
  submissionId: z.number().optional(),
});

const testimonialSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(2, "Name is required"),
  location: z.string().min(2, "Location is required"),
  review: z.string().min(10, "Review is required"),
  rating: z.coerce.number().min(1).max(5),
  image: z.custom<FileList>().optional(),
  existingImage: z.string().optional(),
});

const TestimonialRowImage = ({ src, alt }: { src: string | null, alt: string }) => {
  const [imageSrc, setImageSrc] = useState(src || '/user.png');
  const handleError = () => setImageSrc('/user.png');

  return (
    <Image 
      src={imageSrc} 
      alt={alt} 
      width={40} 
      height={40} 
      className="rounded-full object-cover" 
      onError={handleError}
    />
  );
};


export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [submissions, setSubmissions] = useState<ListingSubmission[]>([]);
  const [listings, setListings] = useState<Motorcycle[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  const [modalState, setModalState] = useState<{
    type: 'motorcycle' | 'testimonial' | null;
    mode: 'add' | 'edit' | 'approve';
    data?: Motorcycle | Testimonial | ListingSubmission;
    isOpen: boolean;
  }>({ type: null, mode: 'add', isOpen: false });

  const { toast } = useToast();

  const passwordForm = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { password: '' },
  });

  const motorcycleForm = useForm<z.infer<typeof motorcycleSchema>>({
    resolver: zodResolver(motorcycleSchema),
  });

  const testimonialForm = useForm<z.infer<typeof testimonialSchema>>({
    resolver: zodResolver(testimonialSchema),
  });

  useEffect(() => {
    if (sessionStorage.getItem('isAdminAuthenticated') === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  async function fetchData() {
    setLoading(true);
    const [
      fetchedSubmissions,
      fetchedListings,
      fetchedTestimonials
    ] = await Promise.all([
      getSubmissions(),
      getMotorcycleListings(),
      getTestimonialsList()
    ]);
    setSubmissions(fetchedSubmissions);
    setListings(fetchedListings);
    setTestimonials(fetchedTestimonials);
    setLoading(false);
  }

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated]);
  
  const handleLogin = (values: z.infer<typeof passwordSchema>) => {
    // This is a simple client-side check. The password is exposed in the client bundle.
    // This is NOT for production use with sensitive data.
    if (values.password === process.env.NEXT_PUBLIC_ADMIN_PASSWORD) {
      sessionStorage.setItem('isAdminAuthenticated', 'true');
      setIsAuthenticated(true);
      toast({ title: 'Authentication successful!' });
    } else {
      toast({
        variant: 'destructive',
        title: 'Authentication Failed',
        description: 'The password you entered is incorrect.',
      });
      passwordForm.reset();
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('isAdminAuthenticated');
    setIsAuthenticated(false);
    toast({ title: 'You have been logged out.' });
  };
  
  const formatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
  });

  const handleAction = async (formAction: (formData: FormData) => Promise<any>, formData: FormData, successMessage: string) => {
    startTransition(async () => {
        try {
            await formAction(formData);
            toast({ title: 'Success', description: successMessage });
            setModalState({ type: null, mode: 'add', isOpen: false });
            fetchData();
        } catch (error) {
            console.error(error);
            toast({ variant: 'destructive', title: 'Error', description: error instanceof Error ? error.message : 'An unexpected error occurred.' });
        }
    });
  };

  const onMotorcycleSubmit = (values: z.infer<typeof motorcycleSchema>) => {
    const formData = new FormData();
    Object.entries(values).forEach(([key, value]) => {
      if (key === 'images' && value) {
        Array.from(value as FileList).forEach(file => formData.append('images', file));
      } else if (key === 'existingImages' && Array.isArray(value)) {
        value.forEach(img => formData.append('existingImages', img));
      } else if (value !== undefined && value !== null) {
        formData.append(key, String(value));
      }
    });
    
    if (modalState.mode === 'add') {
      handleAction(addMotorcycle, formData, 'New motorcycle listing added.');
    } else if (modalState.mode === 'edit' && modalState.data) {
      handleAction(updateMotorcycle, formData, 'Motorcycle listing updated.');
    } else if (modalState.mode === 'approve' && values.submissionId) {
      handleAction(approveAndAddMotorcycle, formData, 'Submission approved and new listing created.');
    }
  };
  
  const onTestimonialSubmit = (values: z.infer<typeof testimonialSchema>) => {
    const formData = new FormData();
     Object.entries(values).forEach(([key, value]) => {
      if (key === 'image' && value instanceof FileList && value.length > 0) {
        formData.append('image', value[0]);
      } else if (value !== undefined && value !== null) {
        formData.append(key, String(value));
      }
    });

    if (modalState.mode === 'add') {
      handleAction(addTestimonial, formData, 'New testimonial added.');
    } else if (modalState.mode === 'edit' && modalState.data) {
       handleAction(updateTestimonial, formData, 'Testimonial updated.');
    }
  };
  
  const openModal = (type: 'motorcycle' | 'testimonial', mode: 'add' | 'edit' | 'approve', data?: Motorcycle | Testimonial | ListingSubmission) => {
    setModalState({ type, mode, data, isOpen: true });
    if (type === 'motorcycle') {
        let defaultValues: Partial<z.infer<typeof motorcycleSchema>> = { year: new Date().getFullYear(), price: 0, kmDriven: 0, engineDisplacement: 150, images: undefined, existingImages: [] };

        if (mode === 'edit' && data) {
           const motorcycleData = data as Motorcycle;
           defaultValues = { ...motorcycleData, existingImages: motorcycleData.images || [] };
        } else if (mode === 'approve' && data) {
           const submission = data as ListingSubmission;
           defaultValues = {
             ...submission,
             existingImages: submission.images || [],
             submissionId: submission.id,
           }
        }
        motorcycleForm.reset(defaultValues as any);
    }
    if (type === 'testimonial') {
        const defaultValues = mode === 'edit' && data ? { ...data, existingImage: (data as Testimonial).image || undefined, image: undefined } : { rating: 5, existingImage: undefined, image: undefined };
        testimonialForm.reset(defaultValues as any);
    }
  };

  const handleRemoveImage = (imageUrl: string) => {
    const currentImages = motorcycleForm.getValues('existingImages') || [];
    motorcycleForm.setValue('existingImages', currentImages.filter(img => img !== imageUrl));
  };


  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Admin Access Required</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={passwordForm.handleSubmit(handleLogin)} className="space-y-4">
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  {...passwordForm.register('password')}
                />
                {passwordForm.formState.errors.password && (
                  <p className="text-sm text-destructive mt-1">
                    {passwordForm.formState.errors.password.message}
                  </p>
                )}
              </div>
              <Button type="submit" className="w-full">
                Login
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  const motorcycleImagesRef = motorcycleForm.register("images");
  const testimonialImageRef = testimonialForm.register("image");

  return (
    <>
    <div className="space-y-8">
       <div className="flex items-center justify-between">
         <h1 className="text-4xl font-bold">Admin Panel</h1>
         <Button variant="outline" onClick={handleLogout}>Logout</Button>
       </div>

      <Card>
        <CardHeader>
          <CardTitle>Submitted Listings for Review</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Loading submissions...</p>
          ) : submissions.length === 0 ? (
            <p>No submissions yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Bike</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead>Price</TableHead>
                     <TableHead>Images</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {submissions.map((sub) => (
                    <TableRow key={sub.id}>
                      <TableCell className="font-medium">{sub.make} {sub.model} <span className="text-muted-foreground">({sub.year})</span></TableCell>
                      <TableCell>{sub.name} <br/> <span className="text-muted-foreground">{sub.phone} | {sub.location}</span></TableCell>
                      <TableCell>{sub.kmDriven.toLocaleString('en-IN')} km <br/> <Badge variant="secondary">{sub.condition}</Badge></TableCell>
                      <TableCell className="font-semibold">{formatter.format(sub.price)}</TableCell>
                      <TableCell>
                          <div className="flex space-x-2">
                              {(sub.images || []).map(img => <a key={img} href={img} target="_blank" rel="noopener noreferrer"><Image src={img} alt="submission image" width={40} height={40} className="rounded object-cover" /></a>)}
                          </div>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button variant="ghost" size="icon" onClick={() => openModal('motorcycle', 'approve', sub)}>
                            <CheckCircle className="h-4 w-4 text-green-500"/>
                        </Button>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive"/></Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete the submission and its images.</AlertDialogDescription></AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleAction(() => deleteSubmission(sub.id), new FormData(), "Submission deleted.")}>Delete</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Current Live Listings</CardTitle>
          <Button size="sm" onClick={() => openModal('motorcycle', 'add')}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add Listing
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Loading listings...</p>
          ) : listings.length === 0 ? (
            <p>No live listings found.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Bike</TableHead>
                    <TableHead>Images</TableHead>
                    <TableHead>Year</TableHead>
                    <TableHead>KM Driven</TableHead>
                    <TableHead>Condition</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {listings.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.make} {item.model}</TableCell>
                      <TableCell>
                          <div className="flex space-x-2">
                              {(item.images || []).map(img => <a key={img} href={img} target="_blank" rel="noopener noreferrer"><Image src={img} alt="listing image" width={40} height={40} className="rounded object-cover" /></a>)}
                          </div>
                      </TableCell>
                      <TableCell>{item.year}</TableCell>
                      <TableCell>{item.kmDriven.toLocaleString('en-IN')}</TableCell>
                      <TableCell><Badge variant="secondary">{item.condition}</Badge></TableCell>
                      <TableCell className="font-semibold">{formatter.format(item.price)}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button variant="ghost" size="icon" onClick={() => openModal('motorcycle', 'edit', item)}>
                            <Pencil className="h-4 w-4"/>
                        </Button>
                         <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive"/></Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete the listing and all its images from storage.</AlertDialogDescription></AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleAction(() => deleteMotorcycle(item.id), new FormData(), "Listing deleted.")}>Delete</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Customer Testimonials</CardTitle>
           <Button size="sm" onClick={() => openModal('testimonial', 'add')}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add Testimonial
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Loading testimonials...</p>
          ) : testimonials.length === 0 ? (
            <p>No testimonials found.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Image</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Review</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {testimonials.map((item) => (
                    <TableRow key={item.id}>
                       <TableCell>
                         <TestimonialRowImage src={item.image} alt={item.name} />
                      </TableCell>
                      <TableCell className="font-medium">{item.name} <br/> <span className="text-muted-foreground text-xs">{item.location}</span></TableCell>
                      <TableCell>{item.rating}/5</TableCell>
                      <TableCell className="max-w-md truncate">{item.review}</TableCell>
                       <TableCell className="text-right space-x-2">
                        <Button variant="ghost" size="icon" onClick={() => openModal('testimonial', 'edit', item)}>
                            <Pencil className="h-4 w-4"/>
                        </Button>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive"/></Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete the testimonial.</AlertDialogDescription></AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleAction(() => deleteTestimonial(item.id), new FormData(), "Testimonial deleted.")}>Delete</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>

    {/* Modals for Add/Edit/Approve */}
    <Dialog open={modalState.isOpen} onOpenChange={(isOpen) => setModalState(prev => ({...prev, isOpen}))}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            {modalState.type === 'motorcycle' && (
                <>
                <DialogHeader>
                    <DialogTitle>{
                      modalState.mode === 'add' ? 'Add New Listing' 
                      : modalState.mode === 'edit' ? 'Edit Listing' 
                      : 'Approve Submission'
                    }</DialogTitle>
                </DialogHeader>
                <Form {...motorcycleForm}>
                    <form onSubmit={motorcycleForm.handleSubmit(onMotorcycleSubmit)} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField control={motorcycleForm.control} name="make" render={({ field }) => ( <FormItem><FormLabel>Make</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                            <FormField control={motorcycleForm.control} name="model" render={({ field }) => ( <FormItem><FormLabel>Model</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                            <FormField control={motorcycleForm.control} name="year" render={({ field }) => ( <FormItem><FormLabel>Year</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem> )} />
                            <FormField control={motorcycleForm.control} name="price" render={({ field }) => ( <FormItem><FormLabel>Price (₹)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem> )} />
                            <FormField control={motorcycleForm.control} name="kmDriven" render={({ field }) => ( <FormItem><FormLabel>KM Driven</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem> )} />
                            <FormField control={motorcycleForm.control} name="engineDisplacement" render={({ field }) => ( <FormItem><FormLabel>Engine (CC)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem> )} />
                            <FormField control={motorcycleForm.control} name="registration" render={({ field }) => ( <FormItem><FormLabel>Registration</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                            <FormField control={motorcycleForm.control} name="condition" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Condition</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl><SelectTrigger><SelectValue placeholder="Select condition" /></SelectTrigger></FormControl>
                                        <SelectContent>{["Excellent", "Good", "Fair", "Poor"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </div>
                        <FormField control={motorcycleForm.control} name="description" render={({ field }) => ( <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem> )} />
                        
                        {(modalState.mode === 'edit' || modalState.mode === 'approve') && (
                          <div className="space-y-2">
                              <FormLabel>Existing Images</FormLabel>
                              <div className="flex flex-wrap gap-2">
                                  {motorcycleForm.getValues('existingImages')?.map((img) => (
                                      <div key={img} className="relative group">
                                          <Image src={img} alt="Existing image" width={80} height={80} className="rounded object-cover"/>
                                          <Button type="button" variant="destructive" size="icon" className="absolute -top-2 -right-2 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100" onClick={() => handleRemoveImage(img)}>
                                              <X className="h-4 w-4"/>
                                          </Button>
                                      </div>
                                  ))}
                              </div>
                               {motorcycleForm.getValues('existingImages')?.length === 0 && <p className="text-sm text-muted-foreground">No images exist for this listing.</p>}
                          </div>
                        )}

                        <FormField control={motorcycleForm.control} name="images" render={() => ( 
                          <FormItem>
                            <FormLabel>{(modalState.mode === 'edit' || modalState.mode === 'approve') ? 'Upload New Images' : 'Images'}</FormLabel>
                            <FormControl><Input type="file" multiple {...motorcycleImagesRef} /></FormControl>
                            <FormDescription>Upload new images here. Un-removed existing images will be kept.</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )} />
                        
                        <DialogFooter>
                            <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
                            <Button type="submit" disabled={isPending}>{isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save</Button>
                        </DialogFooter>
                    </form>
                </Form>
                </>
            )}

            {modalState.type === 'testimonial' && (
                 <>
                <DialogHeader>
                    <DialogTitle>{modalState.mode === 'add' ? 'Add New Testimonial' : 'Edit Testimonial'}</DialogTitle>
                </DialogHeader>
                <Form {...testimonialForm}>
                    <form onSubmit={testimonialForm.handleSubmit(onTestimonialSubmit)} className="space-y-4">
                        <FormField control={testimonialForm.control} name="name" render={({ field }) => ( <FormItem><FormLabel>Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                        <FormField control={testimonialForm.control} name="location" render={({ field }) => ( <FormItem><FormLabel>Location</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                        <FormField control={testimonialForm.control} name="rating" render={({ field }) => ( <FormItem><FormLabel>Rating (1-5)</FormLabel><FormControl><Input type="number" min="1" max="5" {...field} /></FormControl><FormMessage /></FormItem> )} />
                        <FormField control={testimonialForm.control} name="review" render={({ field }) => ( <FormItem><FormLabel>Review</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem> )} />

                        {modalState.mode === 'edit' && testimonialForm.getValues().existingImage && (
                             <div className="space-y-2">
                                <FormLabel>Current Image</FormLabel>
                                <div className="flex items-center gap-4">
                                     <Image src={testimonialForm.getValues().existingImage!} alt="Current testimonial image" width={60} height={60} className="rounded-md object-cover"/>
                                     <Button variant="outline" size="sm" onClick={() => testimonialForm.setValue('existingImage', '')}>Remove Image</Button>
                                </div>
                                <FormDescription>Removing the image will save the testimonial without one. You can upload a new one below to replace it.</FormDescription>
                             </div>
                        )}
                        
                        <FormField control={testimonialForm.control} name="image" render={() => ( 
                          <FormItem>
                            <FormLabel>{testimonialForm.getValues().existingImage ? 'Upload New Image' : 'Image'}</FormLabel>
                            <FormControl><Input type="file" {...testimonialImageRef} /></FormControl>
                             {modalState.mode === 'edit' && testimonialForm.getValues().existingImage && (
                                <FormDescription>Upload a new file to replace the current one.</FormDescription>
                             )}
                            <FormMessage />
                          </FormItem>
                        )} />
                        
                        <DialogFooter>
                            <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
                            <Button type="submit" disabled={isPending}>{isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save</Button>
                        </DialogFooter>
                    </form>
                </Form>
                </>
            )}
        </DialogContent>
    </Dialog>
    </>
  );
}

    

    