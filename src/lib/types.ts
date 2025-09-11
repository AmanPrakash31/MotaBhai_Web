
export interface Motorcycle {
  id: number;
  make: string;
  model: string;
  year: number;
  price: number;
  kmDriven: number;
  engineDisplacement: number;
  registration: string;
  condition: 'Excellent' | 'Good' | 'Fair' | 'Poor';
  description: string;
  images: string[] | null;
}

export interface Testimonial {
  id: number;
  name: string;
  location: string;
  review: string;
  rating: number;
  image: string | null;
}
