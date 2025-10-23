import type { LoaderFunctionArgs } from "@remix-run/node";
import { prisma } from "~/lib/db.server";

/**
 * Debug endpoint to check affiliates
 */
export const loader = async ({ request }: LoaderFunctionArgs) => {
  try {
    console.log('[Debug] Checking affiliates...');

    const affiliates = await prisma.affiliates.findMany();

    console.log('[Debug] Found affiliates:', affiliates.length);

    return new Response(JSON.stringify({
      success: true,
      count: affiliates.length,
      affiliates: affiliates,
      note: 'This endpoint uses Prisma (backend) to read affiliates'
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    console.error('[Debug] Error:', error);
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
