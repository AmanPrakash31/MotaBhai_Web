import { motorcycles } from '@/lib/data';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Calendar, Gauge, ShieldCheck, Tag, Wrench } from 'lucide-react';

export function generateStaticParams() {
  return motorcycles.map((motorcycle) => ({
    id: motorcycle.id,
  }));
}

export default function MotorcycleDetailPage({ params }: { params: { id: string } }) {
  const motorcycle = motorcycles.find(m => m.id === params.id);

  if (!motorcycle) {
    notFound();
  }
  
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  });

  const specItems = [
    { icon: Calendar, label: 'Year', value: motorcycle.year },
    { icon: Gauge, label: 'Mileage', value: `${motorcycle.mileage.toLocaleString()} mi` },
    { icon: ShieldCheck, label: 'Condition', value: motorcycle.condition },
    { icon: Tag, label: 'Price', value: formatter.format(motorcycle.price) },
  ];

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <Button variant="outline" asChild className="mb-8">
        <Link href="/">
          &larr; Back to Listings
        </Link>
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
        <div className="lg:col-span-3">
          <Carousel className="w-full rounded-lg overflow-hidden shadow-lg">
            <CarouselContent>
              {motorcycle.images.map((src, index) => (
                <CarouselItem key={index}>
                  <div className="aspect-w-16 aspect-h-10">
                    <Image
                      src={src}
                      alt={`${motorcycle.make} ${motorcycle.model} - Image ${index + 1}`}
                      data-ai-hint="motorcycle detail"
                      width={800}
                      height={600}
                      className="object-cover w-full"
                      priority={index === 0}
                    />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="left-4" />
            <CarouselNext className="right-4" />
          </Carousel>
        </div>

        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <Badge variant="secondary" className="w-fit mb-2">{motorcycle.make}</Badge>
              <CardTitle className="text-4xl font-bold">{motorcycle.model}</CardTitle>
              <p className="text-2xl font-semibold text-primary">{formatter.format(motorcycle.price)}</p>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mt-2">{motorcycle.description}</p>
              
              <Separator className="my-6" />

              <div className="space-y-4">
                {specItems.map(item => (
                  <div key={item.label} className="flex items-center justify-between">
                    <div className="flex items-center text-muted-foreground">
                      <item.icon className="w-5 h-5 mr-3" />
                      <span className="font-medium">{item.label}</span>
                    </div>
                    <span className={`font-semibold ${item.label === 'Price' ? 'text-primary' : ''}`}>{item.value}</span>
                  </div>
                ))}
              </div>

              <Separator className="my-6" />

              <Button size="lg" className="w-full text-lg">
                Contact Seller to Inquire
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}