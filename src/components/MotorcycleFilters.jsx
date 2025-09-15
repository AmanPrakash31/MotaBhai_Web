
'use client';

import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';

const formatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 0,
});

export default function MotorcycleFilters({ filters, onFilterChange, onReset, motorcycles }) {
  const makes = ['all', ...Array.from(new Set(motorcycles.map(m => m.make)))];
  const conditions = ['all', 'Excellent', 'Good', 'Fair', 'Poor'];

  const maxPrice = Math.max(...motorcycles.map(m => m.price), 300000);

  return (
    <Card>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          <div className="space-y-2">
            <Label htmlFor="search">Search by Make/Model</Label>
            <Input
              id="search"
              placeholder="e.g., Royal Enfield Classic 350"
              value={filters.search}
              onChange={(e) => onFilterChange('search', e)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="make">Make</Label>
            <Select value={filters.make} onValueChange={(value) => onFilterChange('make', value)}>
              <SelectTrigger id="make">
                <SelectValue placeholder="All Makes" />
              </SelectTrigger>
              <SelectContent>
                {makes.map(make => (
                  <SelectItem key={make} value={make}>{make === 'all' ? 'All Makes' : make}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="condition">Condition</Label>
            <Select value={filters.condition} onValueChange={(value) => onFilterChange('condition', value)}>
              <SelectTrigger id="condition">
                <SelectValue placeholder="All Conditions" />
              </SelectTrigger>
              <SelectContent>
                {conditions.map(c => (
                  <SelectItem key={c} value={c}>{c === 'all' ? 'All Conditions' : c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 lg:col-span-1">
             <Label htmlFor="price">Price Range</Label>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{formatter.format(filters.priceRange[0])}</span>
              <span>{formatter.format(filters.priceRange[1])}</span>
            </div>
            <Slider
              id="price"
              min={0}
              max={maxPrice}
              step={1000}
              value={filters.priceRange}
              onValueChange={(value) => onFilterChange('priceRange', value)}
            />
          </div>
        </div>
        <div className="flex justify-end mt-4">
          <Button variant="ghost" onClick={onReset}>Reset Filters</Button>
        </div>
      </CardContent>
    </Card>
  );
}
