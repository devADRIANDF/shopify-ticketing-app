import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { authenticate } from "~/shopify.server";

/**
 * Diagnostic endpoint to check webhook registration status
 */
export const loader = async ({ request }: LoaderFunctionArgs) => {
  try {
    const { admin, session } = await authenticate.admin(request);

    // Get all webhooks
    const webhooksQuery = `
      {
        webhookSubscriptions(first: 20) {
          edges {
            node {
              id
              topic
              endpoint {
                __typename
                ... on WebhookHttpEndpoint {
                  callbackUrl
                }
              }
            }
          }
        }
      }
    `;

    const response = await admin.graphql(webhooksQuery);
    const result = await response.json();

    return json({
      success: true,
      shop: session.shop,
      webhooks: result.data?.webhookSubscriptions?.edges || [],
      scopes: session.scope,
    });
  } catch (error) {
    console.error("[Webhook Status] Error:", error);
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
};
