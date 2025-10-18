import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { authenticate } from "~/shopify.server";

/**
 * Debug endpoint to check order metafields and tickets
 */
export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  try {
    const { admin } = await authenticate.admin(request);
    const { orderId } = params;

    if (!orderId) {
      return json({ error: "Order ID is required" }, { status: 400 });
    }

    // Get order details including metafields
    const orderQuery = `
      query GetOrder($id: ID!) {
        order(id: $id) {
          id
          name
          email
          lineItems(first: 10) {
            edges {
              node {
                id
                title
                quantity
                product {
                  id
                  tags
                }
              }
            }
          }
          metafields(first: 10) {
            edges {
              node {
                namespace
                key
                value
                type
              }
            }
          }
        }
      }
    `;

    const response = await admin.graphql(orderQuery, {
      variables: {
        id: `gid://shopify/Order/${orderId}`,
      },
    });

    const result = await response.json();

    return json({
      success: true,
      order: result.data?.order,
    });
  } catch (error) {
    console.error("[Debug Order] Error:", error);
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
};
