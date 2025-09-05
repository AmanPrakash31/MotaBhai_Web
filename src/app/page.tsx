'use client';

import { useState, useMemo } from 'react';
import type { ChangeEvent } from 'react';
import { motorcycles as allMotorcycles } from '@/lib/data';
import MotorcycleCard from '@/components/MotorcycleCard';
import MotorcycleFilters, { type Filters } from '@/components/MotorcycleFilters';
import type { Motorcycle } from '@/lib/types';

export default function Home() {
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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-12">
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
  );
}
