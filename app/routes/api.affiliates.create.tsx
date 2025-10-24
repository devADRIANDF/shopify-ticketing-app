import type { ActionFunctionArgs } from "@remix-run/node";
import { prisma } from "~/lib/db.server";

/**
 * API endpoint to create a new affiliate
 */
export const action = async ({ request }: ActionFunctionArgs) => {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({
      success: false,
      error: 'Method not allowed'
    }), {
      status: 405,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }

  try {
    const body = await request.json();
    const { name, email, commission_type, commission_value, unique_code, access_token } = body;

    // Validate required fields
    if (!name || !email || !commission_type || commission_value === undefined || !unique_code || !access_token) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing required fields'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    console.log('[Create Affiliate] Creating:', { name, email, unique_code });

    // Check if affiliate with email already exists
    const existing = await prisma.affiliates.findFirst({
      where: { email }
    });

    if (existing) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Ya existe un afiliado con ese email'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // Create affiliate
    const affiliate = await prisma.affiliates.create({
      data: {
        name,
        email,
        unique_code,
        access_token,
        commission_type,
        commission_value: parseFloat(commission_value),
        total_sales: 0,
        total_commission: 0,
      },
    });

    console.log('[Create Affiliate] ✅ Created:', affiliate.id);

    return new Response(JSON.stringify({
      success: true,
      affiliate
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    console.error('[Create Affiliate] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
};

// Handle CORS preflight
export const loader = async () => {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
};
