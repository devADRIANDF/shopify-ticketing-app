import type { ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { authenticate } from "~/shopify.server";

/**
 * Setup endpoint to create metafield definition
 */
export const action = async ({ request }: ActionFunctionArgs) => {
  try {
    console.log("[Setup Metafields] Authenticating...");
    const { admin } = await authenticate.admin(request);

    console.log("[Setup Metafields] Creating metafield definition...");

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

    console.log("[Setup Metafields] GraphQL response:", JSON.stringify(result, null, 2));

    if (result.data?.metafieldDefinitionCreate?.userErrors?.length > 0) {
      const errors = result.data.metafieldDefinitionCreate.userErrors;
      console.error("[Setup Metafields] User errors:", errors);

      // Check if it already exists
      const errorMessage = errors[0]?.message || "";
      if (errorMessage.includes("taken") || errorMessage.includes("already exists")) {
        console.log("[Setup Metafields] Metafield definition already exists - this is OK");
        return json({
          success: true,
          message: "Metafield definition already exists",
          alreadyExists: true,
        });
      }

      return json({
        success: false,
        error: errors.map((e: any) => e.message).join(", "),
      });
    }

    console.log("[Setup Metafields] Success! Created:", result.data?.metafieldDefinitionCreate?.createdDefinition);

    return json({
      success: true,
      message: "Metafield definition created successfully",
      definition: result.data?.metafieldDefinitionCreate?.createdDefinition,
    });
  } catch (error) {
    console.error("[Setup Metafields] Error:", error);

    // Better error handling
    let errorMessage = "Unknown error";
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === "string") {
      errorMessage = error;
    }

    return json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
};

export const loader = async () => {
  return json({ message: "Use POST to setup metafields" }, { status: 405 });
};
