
'use client';

import { useState } from 'react';
import type { Testimonial } from '@/lib/types';
import Image from 'next/image';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Star } from 'lucide-react';

const Rating = ({ rating }: { rating: number }) => {
  return (
    <div className="flex items-center gap-0.5">
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          className={`w-4 h-4 ${
            i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
          }`}
        />
      ))}
    </div>
  );
};

export default function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
  const [imageSrc, setImageSrc] = useState(testimonial.image || '/user.png');

  const handleImageError = () => {
    // A generic placeholder if the original image fails
    setImageSrc('/user.png'); 
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex flex-row items-center gap-4">
        <Image
          src={imageSrc}
          alt={testimonial.name}
          data-ai-hint="customer photo"
          width={56}
          height={56}
          className="rounded-full object-cover"
          onError={handleImageError}
        />
        <div className="flex flex-col">
          <p className="font-semibold">{testimonial.name}</p>
          <p className="text-sm text-muted-foreground">{testimonial.location}</p>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col flex-grow pt-0">
        <Rating rating={testimonial.rating} />
        <blockquote className="mt-4 text-sm text-muted-foreground border-l-2 pl-4 italic flex-grow">
          {testimonial.review}
        </blockquote>
      </CardContent>
    </Card>
  );
}
