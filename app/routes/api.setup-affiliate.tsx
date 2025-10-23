import type { ActionFunctionArgs } from "@remix-run/node";
import { prisma } from "~/lib/db.server";

/**
 * Setup endpoint to create test affiliate
 */
export const action = async ({ request }: ActionFunctionArgs) => {
  try {
    console.log('[Setup] Setting up affiliate system...');

    // Step 1: Enable RLS and create policies using raw SQL
    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE affiliates ENABLE ROW LEVEL SECURITY;`);
      console.log('[Setup] ✅ RLS enabled');
    } catch (e) {
      console.log('[Setup] RLS already enabled or error:', e);
    }

    try {
      await prisma.$executeRawUnsafe(`
        DROP POLICY IF EXISTS "Allow public read access to affiliates" ON affiliates;
        CREATE POLICY "Allow public read access to affiliates"
        ON affiliates FOR SELECT TO anon, authenticated
        USING (true);
      `);
      console.log('[Setup] ✅ SELECT policy created');
    } catch (e) {
      console.log('[Setup] SELECT policy error:', e);
    }

    try {
      await prisma.$executeRawUnsafe(`
        DROP POLICY IF EXISTS "Allow insert access to affiliates" ON affiliates;
        CREATE POLICY "Allow insert access to affiliates"
        ON affiliates FOR INSERT TO anon, authenticated
        WITH CHECK (true);
      `);
      console.log('[Setup] ✅ INSERT policy created');
    } catch (e) {
      console.log('[Setup] INSERT policy error:', e);
    }

    try {
      await prisma.$executeRawUnsafe(`
        DROP POLICY IF EXISTS "Allow update access to affiliates" ON affiliates;
        CREATE POLICY "Allow update access to affiliates"
        ON affiliates FOR UPDATE TO anon, authenticated
        USING (true)
        WITH CHECK (true);
      `);
      console.log('[Setup] ✅ UPDATE policy created');
    } catch (e) {
      console.log('[Setup] UPDATE policy error:', e);
    }

    // Step 2: Check if affiliate already exists
    const existing = await prisma.affiliates.findFirst({
      where: { unique_code: 'PEDRO2024' }
    });

    if (existing) {
      console.log('[Setup] Affiliate already exists');
      return new Response(JSON.stringify({
        success: true,
        message: 'Affiliate system ready! Affiliate already exists.',
        affiliate: existing,
        instructions: {
          landing_page: 'http://localhost:3002/PEDRO2024',
          discount_code: 'PEDRO10',
          admin_panel: 'http://localhost:3002/affiliates'
        }
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Step 3: Create test affiliate
    const accessToken = `${Math.random().toString(36).substring(2)}${Date.now().toString(36)}`;

    const affiliate = await prisma.affiliates.create({
      data: {
        name: 'Pedro Promotor',
        email: 'pedro@example.com',
        unique_code: 'PEDRO2024',
        access_token: accessToken,
        shopify_discount_code: 'PEDRO10',
        commission_type: 'percentage',
        commission_value: 10,
        total_sales: 0,
        total_commission: 0,
      },
    });

    console.log('[Setup] ✅ Affiliate created:', affiliate);

    return new Response(JSON.stringify({
      success: true,
      message: 'Affiliate system setup complete!',
      affiliate,
      instructions: {
        landing_page: 'http://localhost:3002/PEDRO2024',
        affiliate_panel: `http://localhost:3002/affiliate-panel/${accessToken}`,
        discount_code: 'PEDRO10',
        admin_panel: 'http://localhost:3002/affiliates',
        next_steps: [
          '1. Visit http://localhost:3002/affiliates to see all affiliates',
          '2. Create new affiliates from the control panel',
          '3. Visit http://localhost:3002/PEDRO2024 to see the public landing page',
          `4. Visit http://localhost:3002/affiliate-panel/${accessToken} for Pedro's private dashboard`,
          '5. In Shopify, create a discount code "PEDRO10" with 0% discount for tracking'
        ]
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('[Setup] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
