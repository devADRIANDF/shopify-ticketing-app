import type { ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { prisma } from "~/lib/db.server";

/**
 * Emergency endpoint to clear all sessions and force token regeneration
 * This should be called when scopes are updated to force Shopify to generate new tokens
 */
export const action = async ({ request }: ActionFunctionArgs) => {
  try {
    console.log("[Clear Sessions] Deleting all sessions to force token regeneration...");

    const result = await prisma.session.deleteMany({});

    console.log(`[Clear Sessions] Deleted ${result.count} sessions successfully`);

    return json({
      success: true,
      message: `Deleted ${result.count} sessions. New tokens with updated scopes will be generated on next request.`,
      count: result.count,
    });
  } catch (error) {
    console.error("[Clear Sessions] Error:", error);
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
};

export const loader = async () => {
  return json({ message: "Use POST to clear sessions" }, { status: 405 });
};
