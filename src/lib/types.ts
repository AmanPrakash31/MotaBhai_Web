export interface Motorcycle {
  id: string;
  make: string;
  model: string;
  year: number;
  price: number;
  mileage: number;
  condition: 'Excellent' | 'Good' | 'Fair' | 'Poor';
  description: string;
  images: string[];
}
