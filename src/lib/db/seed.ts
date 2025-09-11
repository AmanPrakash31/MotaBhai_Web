import 'dotenv/config';
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from './schema';
import { motorcycles as motorcyclesData, testimonials as testimonialsData } from '../data';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set in your .env file. Please ensure it is correctly configured.');
}

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

const main = async () => {
  try {
    console.log('Seeding database...');

    // Delete all existing data
    await db.delete(schema.motorcycles);
    await db.delete(schema.testimonials);
    console.log('Cleared existing data.');

    // Insert new data
    const insertedMotorcycles = await db.insert(schema.motorcycles).values(motorcyclesData.map(m => ({
        make: m.make,
        model: m.model,
        year: m.year,
        price: m.price,
        kmDriven: m.kmDriven,
        engineDisplacement: m.engineDisplacement,
        registration: m.registration,
        condition: m.condition,
        description: m.description,
        images: m.images
    }))).returning();
    console.log(`Seeded ${insertedMotorcycles.length} motorcycles`);

    const insertedTestimonials = await db.insert(schema.testimonials).values(testimonialsData.map(t => ({
        name: t.name,
        location: t.location,
        review: t.review,
        rating: t.rating,
        image: t.image
    }))).returning();
    console.log(`Seeded ${insertedTestimonials.length} testimonials`);

    console.log('Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

main();
