'use server';
import 'server-only'

import { db } from '@/lib/db';
import { listingSubmissions } from '@/lib/db/schema';
import { desc } from 'drizzle-orm';

export async function getSubmissions() {
  const allSubmissions = await db.select().from(listingSubmissions).orderBy(desc(listingSubmissions.submittedAt));
  return allSubmissions;
}
