import 'dotenv/config';
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from './schema';
import { motorcycles, testimonials } from '../data';

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

const main = async () => {
  try {
    console.log('Seeding database...');

    // Delete all existing data
    await db.delete(schema.motorcycles);
    await db.delete(schema.testimonials);

    // Insert new data
    const insertedMotorcycles = await db.insert(schema.motorcycles).values(motorcycles.map(m => ({...m, id: undefined}))).returning();
    console.log(`Seeded ${insertedMotorcycles.length} motorcycles`);

    const insertedTestimonials = await db.insert(schema.testimonials).values(testimonials.map(t => ({...t, id: undefined}))).returning();
    console.log(`Seeded ${insertedTestimonials.length} testimonials`);

    console.log('Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

main();
