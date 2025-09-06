"use client";

import { useState, useMemo } from "react";
import type { ChangeEvent } from "react";
import { motorcycles as allMotorcycles, testimonials } from "@/lib/data";
import MotorcycleCard from "@/components/MotorcycleCard";
import MotorcycleFilters, {
  type Filters,
} from "@/components/MotorcycleFilters";
import TestimonialCard from "@/components/TestimonialCard";
import type { Motorcycle } from "@/lib/types";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { FileText, HomeIcon, IndianRupee, Star, ThumbsUp, Medal } from "lucide-react";
import Image from "next/image";
import "./split-hover.css";
export default function HomePage() {
  const [filters, setFilters] = useState<Filters>({
    search: "",
    make: "all",
    condition: "all",
    priceRange: [40000, 300000],
  });

  const handleFilterChange = (
    key: keyof Filters,
    value: string | number | number[] | ChangeEvent<HTMLInputElement>
  ) => {
    if (key === "search" && typeof value === "object" && "target" in value) {
      setFilters((prev) => ({
        ...prev,
        [key]: (value as ChangeEvent<HTMLInputElement>).target.value,
      }));
    } else {
      setFilters((prev) => ({ ...prev, [key]: value }));
    }
  };

  const handleResetFilters = () => {
    setFilters({
      search: "",
      make: "all",
      condition: "all",
      priceRange: [40000, 300000],
    });
  };

  const filteredMotorcycles = useMemo(() => {
    return allMotorcycles.filter((motorcycle: Motorcycle) => {
      const { search, make, condition, priceRange } = filters;
      const [minPrice, maxPrice] = priceRange;

      return (
        (search.toLowerCase() === "" ||
          motorcycle.make.toLowerCase().includes(search.toLowerCase()) ||
          motorcycle.model.toLowerCase().includes(search.toLowerCase())) &&
        (make === "all" || motorcycle.make === make) &&
        (condition === "all" || motorcycle.condition === condition) &&
        motorcycle.price >= minPrice &&
        motorcycle.price <= maxPrice
      );
    });
  }, [filters]);

  const sellSteps = [
    {
      step: "01",
      icon: FileText,
      title: "Enter Bike Details",
      description:
        "Enter your bike details to get an instant estimated selling price.",
    },
    {
      step: "02",
      icon: HomeIcon,
      title: "Book Inspection",
      description:
        "Book an appointment for vehicle inspection at home or at a MotaBhai branch.",
    },
    {
      step: "03",
      icon: IndianRupee,
      title: "Sell at Best Price",
      description:
        "Get the best price and get paid instantly. We also take care of the RC Transfer and insurance for free.",
    },
  ];

  const whyChooseUsPoints = [
      {
        icon: Medal,
        title: "Quality You Can Trust",
        description: "Every bike undergoes a rigorous inspection to ensure it meets our high standards for performance and safety."
      },
      {
        icon: ThumbsUp,
        title: "Hassle-Free Experience",
        description: "From transparent pricing to handling all paperwork like RC Transfer, we make buying or selling a bike seamless."
      },
      {
        icon: Star,
        title: "Trusted Local Dealer",
        description: "As a proud local business in Muzaffarpur, we are committed to serving our community with honesty and integrity."
      }
  ];

  return (
    <>
      <section className="h-[75vh] min-h-[500px] flex w-full">
        <div className="split-hover-container">
          <div
            className="split-item left"
            style={{ backgroundImage: 'url("/buy.jpg")' }}
            data-ai-hint="motorcycle group"
          >
            <div className="split-content">
              <h2 className="text-sm font-bold uppercase tracking-widest text-secondary-foreground">
                Find Your Dream Bike
              </h2>
              <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mt-2">
                Looking to Buy?
              </h1>
              <p className="mt-4 text-lg md:text-xl max-w-2xl mx-auto">
                Explore our curated collection of certified pre-owned
                motorcycles.
              </p>
              <Button asChild size="lg" className="mt-8 w-full sm:w-auto">
                <Link href="#browse-bikes">Browse Bikes</Link>
              </Button>
            </div>
          </div>
          <div
            className="split-item right"
            style={{ backgroundImage: 'url("/sell.jpg")' }}
            data-ai-hint="mechanic working"
          >
            <div className="split-content">
              <h2 className="text-sm font-bold uppercase tracking-widest text-accent-foreground">
                USED TWO WHEELER - BUY & SELL ONLINE
              </h2>
              <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mt-2">
                Sell Your Bike
              </h1>
              <p className="mt-4 text-lg md:text-xl max-w-2xl mx-auto">
                Get the best price for your bike in just a few easy steps.
              </p>
              <Button
                asChild
                size="lg"
                variant="secondary"
                className="mt-8 w-full sm:w-auto"
              >
                <Link href="/sell">Sell Your Bike</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 my-12 bg-secondary/50 rounded-lg">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-sm font-bold uppercase tracking-widest text-accent-foreground">
            USED TWO WHEELER - BUY & SELL ONLINE
          </h2>
          <p className="text-3xl md:text-4xl font-bold tracking-tight mt-2">
            Sell Your Bike in 3 Easy Steps
          </p>
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
                  <p className="text-muted-foreground mt-2 text-sm">
                    {item.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
          <Button asChild size="lg" className="mt-12">
            <Link href="/sell">Sell Your Bike</Link>
          </Button>
        </div>
      </section>

      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
            <div className="text-center mb-12">
                <h2 className="text-sm font-bold uppercase tracking-widest text-primary">
                    Your Trusted Local Dealer
                </h2>
                <p className="text-3xl md:text-4xl font-bold tracking-tight mt-2">
                    Why Choose Mota Bhai Automobiles?
                </p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div>
                    <Image 
                        src="/shop-front.jpg"
                        alt="Mota Bhai Automobiles shop front with staff"
                        data-ai-hint="dealership team"
                        width={600}
                        height={450}
                        className="rounded-lg shadow-xl w-full"
                    />
                </div>
                <div className="space-y-8">
                    {whyChooseUsPoints.map((point) => (
                        <div key={point.title} className="flex gap-4">
                           <div className="flex-shrink-0">
                                <div className="bg-primary/10 text-primary rounded-full p-3">
                                    <point.icon className="w-6 h-6" />
                                </div>
                            </div>
                            <div>
                                <h3 className="text-xl font-semibold">{point.title}</h3>
                                <p className="text-muted-foreground mt-1">{point.description}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
      </section>

      <section className="py-16 bg-secondary/50">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-sm font-bold uppercase tracking-widest text-primary">
            What Our Customers Say
          </h2>
          <p className="text-3xl md:text-4xl font-bold tracking-tight mt-2">
            Trusted by Riders Across Bihar
          </p>
          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
            className="w-full max-w-5xl mx-auto mt-12"
          >
            <CarouselContent>
              {testimonials.map((testimonial) => (
                <CarouselItem
                  key={testimonial.id}
                  className="md:basis-1/2 lg:basis-1/3"
                >
                  <div className="p-1">
                    <TestimonialCard testimonial={testimonial} />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="left-[-50px] top-1/2 -translate-y-1/2" />
            <CarouselNext className="right-[-50px] top-1/2 -translate-y-1/2" />
          </Carousel>
        </div>
      </section>

      <div id="browse-bikes" className="container mx-auto px-4 py-8">
        <div className="text-center mb-12 pt-12">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            Find Your Next Ride
          </h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Browse our curated collection of high-quality, pre-owned
            motorcycles.
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
            {filteredMotorcycles.map((motorcycle) => (
              <MotorcycleCard key={motorcycle.id} motorcycle={motorcycle} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 mt-12 bg-card rounded-lg">
            <h2 className="text-2xl font-semibold">No Motorcycles Found</h2>
            <p className="mt-2 text-muted-foreground">
              Try adjusting your filters or check back later.
            </p>
            <button
              onClick={handleResetFilters}
              className="mt-4 text-primary hover:underline"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>
    </>
  );
}

    