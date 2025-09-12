import { pgTable, serial, text, integer, varchar, real, timestamp } from 'drizzle-orm/pg-core';
import { InferSelectModel } from 'drizzle-orm';

export const motorcycles = pgTable('motorcycles', {
  id: serial('id').primaryKey(),
  make: varchar('make', { length: 256 }).notNull(),
  model: varchar('model', { length: 256 }).notNull(),
  year: integer('year').notNull(),
  price: integer('price').notNull(),
  kmDriven: integer('km_driven').notNull(),
  engineDisplacement: integer('engine_displacement').notNull(),
  registration: varchar('registration', { length: 256 }).notNull(),
  condition: text('condition', { enum: ['Excellent', 'Good', 'Fair', 'Poor'] }).notNull(),
  description: text('description').notNull(),
  images: text('images').array(),
});

export const testimonials = pgTable('testimonials', {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 256 }).notNull(),
    location: varchar('location', { length: 256 }).notNull(),
    review: text('review').notNull(),
    rating: integer('rating').notNull(),
    image: text('image'),
});

export const listingSubmissions = pgTable('listing_submissions', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 256 }).notNull(),
  phone: varchar('phone', { length: 50 }).notNull(),
  location: varchar('location', { length: 256 }).notNull(),
  make: varchar('make', { length: 256 }).notNull(),
  model: varchar('model', { length: 256 }).notNull(),
  year: integer('year').notNull(),
  price: integer('price').notNull(),
  kmDriven: integer('km_driven').notNull(),
  engineDisplacement: integer('engine_displacement').notNull(),
  registration: varchar('registration', { length: 256 }).notNull(),
  condition: text('condition', { enum: ['Excellent', 'Good', 'Fair', 'Poor'] }).notNull(),
  description: text('description').notNull(),
  images: text('images').array(),
  submittedAt: timestamp('submitted_at').defaultNow().notNull(),
});


export type Motorcycle = InferSelectModel<typeof motorcycles>;
export type Testimonial = InferSelectModel<typeof testimonials>;
export type ListingSubmission = InferSelectModel<typeof listingSubmissions>;
