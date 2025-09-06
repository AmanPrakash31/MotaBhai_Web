export interface Motorcycle {
  id: string;
  make: string;
  model: string;
  year: number;
  price: number;
  mileage: number;
  engineDisplacement: number;
  registration: string;
  condition: 'Excellent' | 'Good' | 'Fair' | 'Poor';
  description: string;
  images: string[];
}

export interface Testimonial {
  id: string;
  name: string;
  location: string;
  review: string;
  rating: number;
  image: string;
}
