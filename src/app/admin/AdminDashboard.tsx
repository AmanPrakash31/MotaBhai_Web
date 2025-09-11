'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { getSubmissions } from './actions';
import type { ListingSubmission } from '@/lib/db/schema';
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

const passwordSchema = z.object({
  password: z.string().min(1, 'Password is required.'),
});

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [submissions, setSubmissions] = useState<ListingSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { password: '' },
  });

  useEffect(() => {
    // Check session storage for auth status
    if (sessionStorage.getItem('isAdminAuthenticated') === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      async function fetchSubmissions() {
        setLoading(true);
        const fetchedSubmissions = await getSubmissions();
        setSubmissions(fetchedSubmissions);
        setLoading(false);
      }
      fetchSubmissions();
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
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Submitted Listings</CardTitle>
        <Button variant="outline" onClick={handleLogout}>Logout</Button>
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
  );
}
