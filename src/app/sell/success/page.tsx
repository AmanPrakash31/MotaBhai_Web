'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, Home } from 'lucide-react';
import Link from 'next/link';

export default function SellSuccessPage() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/');
    }, 10000); // 10 seconds

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="container mx-auto max-w-2xl py-12 px-4 flex items-center justify-center min-h-[60vh]">
      <Card className="w-full text-center shadow-lg">
        <CardHeader>
          <div className="mx-auto bg-green-100 rounded-full h-16 w-16 flex items-center justify-center">
            <CheckCircle2 className="h-10 w-10 text-green-600" />
          </div>
          <CardTitle className="text-3xl font-bold mt-4">✅ Submission Received!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Thank you for submitting your motorcycle details. We will review your listing shortly.
          </p>
          <div className="text-left bg-secondary p-4 rounded-md">
            <h3 className="font-semibold text-lg mb-2">What's Next?</h3>
            <p className="text-muted-foreground">
              For further negotiation and to complete the process, please visit our store with your vehicle.
            </p>
             <div className="mt-4 border-t pt-4">
                <p className="font-bold">Mota Bhai Automobiles</p>
                <p>NH28 Near Housing Board Office, Muzaffarpur, Bihar-843108</p>
                <p>Mobile: 8092155018, 7858923003</p>
                <p>Email: motabhaiautomobile@gmail.com</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground pt-4">
            You will be redirected to the homepage in 10 seconds.
          </p>
          <Button asChild>
            <Link href="/">
                <Home className="mr-2 h-4 w-4" /> Go to Homepage Now
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
