import type { ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { authenticate } from "~/shopify.server";

/**
 * Setup endpoint to create metafield definition
 */
export const action = async ({ request }: ActionFunctionArgs) => {
  try {
    const { admin } = await authenticate.admin(request);

    // Create metafield definition for order tickets
    const mutation = `
      mutation CreateMetafieldDefinition {
        metafieldDefinitionCreate(
          definition: {
            name: "Tickets"
            namespace: "validiam"
            key: "tickets"
            description: "QR code tickets data for order"
            type: "json"
            ownerType: ORDER
          }
        ) {
          createdDefinition {
            id
            name
            namespace
            key
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const response = await admin.graphql(mutation);
    const result = await response.json();

    if (result.data?.metafieldDefinitionCreate?.userErrors?.length > 0) {
      console.error("[Setup] Metafield definition errors:", result.data.metafieldDefinitionCreate.userErrors);
      return json({
        success: false,
        errors: result.data.metafieldDefinitionCreate.userErrors,
      });
    }

    console.log("[Setup] Metafield definition created:", result.data?.metafieldDefinitionCreate?.createdDefinition);

    return json({
      success: true,
      definition: result.data?.metafieldDefinitionCreate?.createdDefinition,
    });
  } catch (error) {
    console.error("[Setup] Error:", error);
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
  return json({ message: "Use POST to setup metafields" }, { status: 405 });
};
