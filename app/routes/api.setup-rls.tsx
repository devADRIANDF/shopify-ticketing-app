import type { ActionFunctionArgs } from "@remix-run/node";
import { prisma } from "~/lib/db.server";

/**
 * Setup RLS policies for affiliates table
 */
export const action = async ({ request }: ActionFunctionArgs) => {
  try {
    console.log('[Setup RLS] Creating policies for affiliates table...');

    // Enable RLS on affiliates table
    await prisma.$executeRawUnsafe(`
      ALTER TABLE affiliates ENABLE ROW LEVEL SECURITY;
    `);

    // Create policy for SELECT
    await prisma.$executeRawUnsafe(`
      CREATE POLICY IF NOT EXISTS "Allow public read access to affiliates"
      ON affiliates FOR SELECT TO anon, authenticated
      USING (true);
    `);

    // Create policy for INSERT
    await prisma.$executeRawUnsafe(`
      CREATE POLICY IF NOT EXISTS "Allow insert access to affiliates"
      ON affiliates FOR INSERT TO anon, authenticated
      WITH CHECK (true);
    `);

    // Create policy for UPDATE
    await prisma.$executeRawUnsafe(`
      CREATE POLICY IF NOT EXISTS "Allow update access to affiliates"
      ON affiliates FOR UPDATE TO anon, authenticated
      USING (true)
      WITH CHECK (true);
    `);

    console.log('[Setup RLS] ✅ RLS policies created successfully');

    return new Response(JSON.stringify({
      success: true,
      message: 'RLS policies created successfully',
      policies: [
        'Allow public read access to affiliates',
        'Allow insert access to affiliates',
        'Allow update access to affiliates'
      ]
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('[Setup RLS] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      note: 'This is expected if policies already exist'
    }), {
      status: 200, // Return 200 even on error because policies might already exist
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
