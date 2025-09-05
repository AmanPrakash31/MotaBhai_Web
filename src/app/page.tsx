'use client';

import { useState, useMemo } from 'react';
import type { ChangeEvent } from 'react';
import { motorcycles as allMotorcycles } from '@/lib/data';
import MotorcycleCard from '@/components/MotorcycleCard';
import MotorcycleFilters, { type Filters } from '@/components/MotorcycleFilters';
import type { Motorcycle } from '@/lib/types';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { FileText, Home as HomeIcon, IndianRupee } from 'lucide-react';
import Image from 'next/image';

export default function HomePage() {
  const [filters, setFilters] = useState<Filters>({
    search: '',
    make: 'all',
    condition: 'all',
    priceRange: [0, 25000],
  });

  const handleFilterChange = (
    key: keyof Filters,
    value: string | number | number[] | ChangeEvent<HTMLInputElement>
  ) => {
    if (key === 'search' && typeof value === 'object' && 'target' in value) {
      setFilters(prev => ({ ...prev, [key]: (value as ChangeEvent<HTMLInputElement>).target.value }));
    } else {
      setFilters(prev => ({ ...prev, [key]: value }));
    }
  };
  
  const handleResetFilters = () => {
    setFilters({
      search: '',
      make: 'all',
      condition: 'all',
      priceRange: [0, 25000],
    });
  };

  const filteredMotorcycles = useMemo(() => {
    return allMotorcycles.filter((motorcycle: Motorcycle) => {
      const { search, make, condition, priceRange } = filters;
      const [minPrice, maxPrice] = priceRange;

      return (
        (search.toLowerCase() === '' ||
          motorcycle.make.toLowerCase().includes(search.toLowerCase()) ||
          motorcycle.model.toLowerCase().includes(search.toLowerCase())) &&
        (make === 'all' || motorcycle.make === make) &&
        (condition === 'all' || motorcycle.condition === condition) &&
        (motorcycle.price >= minPrice && motorcycle.price <= maxPrice)
      );
    });
  }, [filters]);

  const sellSteps = [
    {
      step: '01',
      icon: FileText,
      title: 'Enter Bike Details',
      description: 'Enter your bike details to get an instant estimated selling price.',
    },
    {
      step: '02',
      icon: HomeIcon,
      title: 'Book Inspection',
      description: 'Book an appointment for vehicle inspection at home or at a MotaBhai branch.',
    },
    {
      step: '03',
      icon: IndianRupee,
      title: 'Sell at Best Price',
      description: 'Get the best price and get paid instantly. We also take care of the RC Transfer and insurance for free.',
    }
  ];

  return (
    <>
      <section className="relative h-[60vh] min-h-[400px] flex items-center justify-center text-white text-center bg-black">
        <Image
          src="https://picsum.photos/seed/herobike/1600/900"
          alt="Motorcycle on a scenic road"
          data-ai-hint="motorcycle road"
          fill
          className="object-cover opacity-50"
          priority
        />
        <div className="relative z-10 p-4">
          <h2 className="text-sm font-bold uppercase tracking-widest text-primary">USED TWO WHEELER - BUY & SELL ONLINE</h2>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mt-2 text-shadow-lg">Sell Your Bike</h1>
          <p className="mt-4 text-lg md:text-xl max-w-2xl mx-auto">Or are you looking to buy a pre-owned bike?</p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button asChild size="lg" className="w-full sm:w-auto">
              <Link href="/sell">Sell Your Bike</Link>
            </Button>
            <Button asChild size="lg" variant="secondary" className="w-full sm:w-auto">
              <Link href="#browse-bikes">Buy Bike</Link>
            </Button>
          </div>
        </div>
      </section>

      <div id="browse-bikes" className="container mx-auto px-4 py-8">
        <div className="text-center mb-12 pt-12">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Find Your Next Ride</h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Browse our curated collection of high-quality, pre-owned motorcycles.
          </p>
        </div>

        <MotorcycleFilters
          filters={filters}
          onFilterChange={handleFilterChange}
          onReset={handleResetFilters}
          motorcycles={allMotorcycles}
        />

        <section className="py-16 my-12 bg-secondary/50 rounded-lg">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-sm font-bold uppercase tracking-widest text-primary">USED TWO WHEELER - BUY & SELL ONLINE</h2>
            <p className="text-3xl md:text-4xl font-bold tracking-tight mt-2">Sell Your Bike in 3 Easy Steps</p>
            <div className="grid md:grid-cols-3 gap-8 mt-12 max-w-5xl mx-auto">
              {sellSteps.map((item) => (
                <Card key={item.step} className="text-center">
                  <CardContent className="p-6">
                    <div className="relative inline-block">
                      <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground rounded-full h-8 w-8 flex items-center justify-center font-bold text-sm">
                        {item.step}
                      </div>
                      <div className="bg-primary/10 text-primary rounded-full p-4 inline-block">
                        <item.icon className="w-8 h-8" />
                      </div>
                    </div>
                    <h3 className="text-xl font-semibold mt-4">{item.title}</h3>
                    <p className="text-muted-foreground mt-2 text-sm">{item.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
            <Button asChild size="lg" className="mt-12">
              <Link href="/sell">Sell Your Bike</Link>
            </Button>
          </div>
        </section>

        {filteredMotorcycles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-12">
            {filteredMotorcycles.map(motorcycle => (
              <MotorcycleCard key={motorcycle.id} motorcycle={motorcycle} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 mt-12 bg-card rounded-lg">
            <h2 className="text-2xl font-semibold">No Motorcycles Found</h2>
            <p className="mt-2 text-muted-foreground">
              Try adjusting your filters or check back later.
            </p>
            <button onClick={handleResetFilters} className="mt-4 text-primary hover:underline">
              Reset Filters
            </button>
          </div>
        )}
      </div>
    </>
  );
}
