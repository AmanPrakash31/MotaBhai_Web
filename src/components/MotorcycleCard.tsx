import type { Motorcycle } from '@/lib/types';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Gauge, Calendar, Tag } from 'lucide-react';
import { Button } from './ui/button';

export default function MotorcycleCard({ motorcycle }: { motorcycle: Motorcycle }) {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  });

  return (
    <Link href={`/${motorcycle.id}`} className="group">
      <Card className="overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 h-full flex flex-col">
        <CardHeader className="p-0">
          <div className="relative h-56 w-full">
            <Image
              src={motorcycle.images[0]}
              alt={`${motorcycle.make} ${motorcycle.model}`}
              data-ai-hint="motorcycle side"
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </div>
        </CardHeader>
        <CardContent className="p-4 flex-grow flex flex-col">
          <div className="flex justify-between items-start">
            <h3 className="font-bold text-lg">{motorcycle.make} {motorcycle.model}</h3>
            <Badge variant={motorcycle.condition === 'Excellent' ? 'default' : 'secondary'} className={motorcycle.condition === 'Excellent' ? 'bg-primary/90' : ''}>
              {motorcycle.condition}
            </Badge>
          </div>
          <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-2">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              <span>{motorcycle.year}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Gauge className="w-4 h-4" />
              <span>{motorcycle.mileage.toLocaleString()} mi</span>
            </div>
          </div>
          <div className="mt-4 flex-grow" />
          <div className="flex justify-between items-center mt-4">
             <p className="text-2xl font-bold text-primary">{formatter.format(motorcycle.price)}</p>
             <Button variant="ghost" size="sm" className="text-muted-foreground group-hover:text-primary">
                View Details <ArrowRight className="ml-2 h-4 w-4" />
             </Button>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
