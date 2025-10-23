import type { ActionFunctionArgs } from "@remix-run/node";
import { prisma } from "~/lib/db.server";

/**
 * Setup endpoint to create test affiliate
 */
export const action = async ({ request }: ActionFunctionArgs) => {
  try {
    console.log('[Setup] Creating test affiliate...');

    // Check if affiliate already exists
    const existing = await prisma.affiliates.findFirst({
      where: { unique_code: 'PEDRO2024' }
    });

    if (existing) {
      return new Response(JSON.stringify({
        success: true,
        message: 'Affiliate already exists',
        affiliate: existing
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const affiliate = await prisma.affiliates.create({
      data: {
        name: 'Pedro Promotor',
        email: 'pedro@example.com',
        unique_code: 'PEDRO2024',
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
      affiliate,
      instructions: {
        landing_page: 'http://localhost:3002/PEDRO2024',
        discount_code: 'PEDRO10',
        admin_panel: 'http://localhost:3002/affiliates'
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('[Setup] Error creating affiliate:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
