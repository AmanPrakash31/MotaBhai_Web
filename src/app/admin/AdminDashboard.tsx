'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { getSubmissions, getMotorcycleListings, getTestimonialsList } from './actions';
import type { ListingSubmission, Motorcycle, Testimonial } from '@/lib/db/schema';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import Image from 'next/image';

const passwordSchema = z.object({
  password: z.string().min(1, 'Password is required.'),
});

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [submissions, setSubmissions] = useState<ListingSubmission[]>([]);
  const [listings, setListings] = useState<Motorcycle[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { password: '' },
  });

  useEffect(() => {
    if (sessionStorage.getItem('isAdminAuthenticated') === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
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
      form.reset();
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

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Admin Access Required</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(handleLogin)} className="space-y-4">
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  {...form.register('password')}
                />
                {form.formState.errors.password && (
                  <p className="text-sm text-destructive mt-1">
                    {form.formState.errors.password.message}
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

  return (
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
                    <TableHead>Submitted On</TableHead>
                    <TableHead>Contact Name</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Bike</TableHead>
                    <TableHead>Year</TableHead>
                    <TableHead>KM Driven</TableHead>
                    <TableHead>Condition</TableHead>
                    <TableHead className="text-right">Asking Price</TableHead>
                    <TableHead>Description</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {submissions.map((sub) => (
                    <TableRow key={sub.id}>
                      <TableCell>{format(new Date(sub.submittedAt), 'dd MMM yyyy')}</TableCell>
                      <TableCell>{sub.name}</TableCell>
                      <TableCell>{sub.phone}</TableCell>
                      <TableCell>{sub.location}</TableCell>
                      <TableCell className="font-medium">{sub.make} {sub.model}</TableCell>
                      <TableCell>{sub.year}</TableCell>
                      <TableCell>{sub.kmDriven.toLocaleString('en-IN')}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{sub.condition}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-semibold">{formatter.format(sub.price)}</TableCell>
                      <TableCell className="max-w-xs truncate">{sub.description}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Current Live Listings</CardTitle>
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
                    <TableHead>ID</TableHead>
                    <TableHead>Bike</TableHead>
                    <TableHead>Year</TableHead>
                    <TableHead>KM Driven</TableHead>
                    <TableHead>Condition</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {listings.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.id}</TableCell>
                      <TableCell className="font-medium">{item.make} {item.model}</TableCell>
                      <TableCell>{item.year}</TableCell>
                      <TableCell>{item.kmDriven.toLocaleString('en-IN')}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{item.condition}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-semibold">{formatter.format(item.price)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Customer Testimonials</CardTitle>
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
                    <TableHead>ID</TableHead>
                    <TableHead>Image</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Review</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {testimonials.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.id}</TableCell>
                       <TableCell>
                        <Image src={item.image} alt={item.name} width={40} height={40} className="rounded-full" />
                      </TableCell>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>{item.location}</TableCell>
                      <TableCell>{item.rating}/5</TableCell>
                      <TableCell className="max-w-md truncate">{item.review}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
