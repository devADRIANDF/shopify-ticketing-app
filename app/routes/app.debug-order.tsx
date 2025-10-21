import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useSearchParams } from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  BlockStack,
  Text,
  TextField,
  Button,
  Banner,
  InlineStack,
} from "@shopify/polaris";
import { useState, useCallback } from "react";
import { authenticate } from "~/shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop") || "";
  const orderId = url.searchParams.get("orderId");

  if (!shop || !orderId) {
    return json({ shop, order: null, error: null });
  }

  try {
    const { admin } = await authenticate.admin(request);

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
          metafields(first: 20) {
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
      shop,
      order: result.data?.order,
      error: null,
    });
  } catch (error: any) {
    return json({
      shop,
      order: null,
      error: error.message || "Failed to fetch order",
    });
  }
};

export default function DebugOrderPage() {
  const data = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [orderIdInput, setOrderIdInput] = useState(searchParams.get("orderId") || "");

  const handleSearch = useCallback(() => {
    setSearchParams({ shop: data.shop, orderId: orderIdInput });
  }, [orderIdInput, data.shop, setSearchParams]);

  const ticketsMetafield = data.order?.metafields?.edges?.find(
    (edge: any) => edge.node.namespace === "validiam" && edge.node.key === "tickets"
  );

  return (
    <Page
      title="Debug Order Metafields"
      subtitle="Check if metafields are being saved correctly"
      backAction={{ content: "Dashboard", url: `/app?shop=${data.shop}` }}
    >
      <Layout>
        <Layout.Section>
          <BlockStack gap="500">
            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd" fontWeight="semibold">
                  Search Order
                </Text>
                <InlineStack gap="400" align="start">
                  <div style={{ flex: 1 }}>
                    <TextField
                      label="Order ID"
                      value={orderIdInput}
                      onChange={setOrderIdInput}
                      placeholder="e.g., 5678901234567"
                      helpText="Enter the numeric order ID (from the order URL in Shopify admin)"
                      autoComplete="off"
                    />
                  </div>
                  <div style={{ paddingTop: "20px" }}>
                    <Button onClick={handleSearch} variant="primary">
                      Search
                    </Button>
                  </div>
                </InlineStack>
              </BlockStack>
            </Card>

            {data.error && (
              <Banner tone="critical">
                Error: {data.error}
              </Banner>
            )}

            {data.order && (
              <>
                <Card>
                  <BlockStack gap="400">
                    <Text as="h2" variant="headingMd" fontWeight="semibold">
                      Order Information
                    </Text>
                    <Text as="p">
                      <strong>Order:</strong> {data.order.name}
                    </Text>
                    <Text as="p">
                      <strong>Email:</strong> {data.order.email || "N/A"}
                    </Text>
                    <Text as="p">
                      <strong>Line Items:</strong> {data.order.lineItems.edges.length}
                    </Text>
                  </BlockStack>
                </Card>

                <Card>
                  <BlockStack gap="400">
                    <Text as="h2" variant="headingMd" fontWeight="semibold">
                      Tickets Metafield
                    </Text>
                    {ticketsMetafield ? (
                      <>
                        <Banner tone="success">
                          ✅ Tickets metafield found!
                        </Banner>
                        <Text as="p">
                          <strong>Namespace:</strong> {ticketsMetafield.node.namespace}
                        </Text>
                        <Text as="p">
                          <strong>Key:</strong> {ticketsMetafield.node.key}
                        </Text>
                        <Text as="p">
                          <strong>Type:</strong> {ticketsMetafield.node.type}
                        </Text>
                        <div>
                          <Text as="p" variant="bodyMd" fontWeight="semibold">
                            Value:
                          </Text>
                          <div style={{
                            background: "#f6f6f7",
                            padding: "12px",
                            borderRadius: "4px",
                            marginTop: "8px",
                            overflow: "auto"
                          }}>
                            <pre style={{ margin: 0, fontSize: "12px" }}>
                              {JSON.stringify(JSON.parse(ticketsMetafield.node.value), null, 2)}
                            </pre>
                          </div>
                        </div>
                      </>
                    ) : (
                      <Banner tone="warning">
                        ❌ No tickets metafield found on this order
                      </Banner>
                    )}
                  </BlockStack>
                </Card>

                {data.order.metafields.edges.length > 0 && (
                  <Card>
                    <BlockStack gap="400">
                      <Text as="h2" variant="headingMd" fontWeight="semibold">
                        All Metafields ({data.order.metafields.edges.length})
                      </Text>
                      <div style={{
                        background: "#f6f6f7",
                        padding: "12px",
                        borderRadius: "4px",
                        overflow: "auto"
                      }}>
                        <pre style={{ margin: 0, fontSize: "12px" }}>
                          {JSON.stringify(data.order.metafields.edges, null, 2)}
                        </pre>
                      </div>
                    </BlockStack>
                  </Card>
                )}
              </>
            )}
          </BlockStack>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
