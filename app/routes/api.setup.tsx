import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { authenticate } from "~/shopify.server";

/**
 * Simple endpoint to setup metafield definition
 * Just visit this URL once: /api/setup?shop=YOUR_SHOP.myshopify.com
 */
export const loader = async ({ request }: LoaderFunctionArgs) => {
  try {
    const { admin } = await authenticate.admin(request);

    console.log("[Setup] Creating metafield definition...");

    const mutation = `
      mutation {
        metafieldDefinitionCreate(
          definition: {
            name: "Tickets"
            namespace: "validiam"
            key: "tickets"
            description: "Event tickets QR codes"
            type: "json"
            ownerType: ORDER
            access: {
              admin: MERCHANT_READ_WRITE
              storefront: PUBLIC_READ
            }
          }
        ) {
          createdDefinition {
            id
            name
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
      const errors = result.data.metafieldDefinitionCreate.userErrors;
      if (errors[0].message?.includes("taken") || errors[0].message?.includes("exists")) {
        return json({
          success: true,
          message: "Metafield already exists - all good!",
        });
      }
      return json({
        success: false,
        error: errors.map((e: any) => e.message).join(", "),
      });
    }

    return json({
      success: true,
      message: "Metafield definition created successfully!",
      definition: result.data?.metafieldDefinitionCreate?.createdDefinition,
    });
  } catch (error: any) {
    console.error("[Setup] Error:", error);
    return json({
      success: false,
      error: error.message || "Setup failed",
    }, { status: 500 });
  }
};
