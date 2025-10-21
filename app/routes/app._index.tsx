import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useNavigate } from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  BlockStack,
  Text,
  InlineGrid,
  Button,
  Badge,
  InlineStack,
  Modal,
  Box,
} from "@shopify/polaris";
import { useState } from "react";
import { authenticate } from "~/shopify.server";
import { getTicketsByShop } from "~/services/ticket.server";
import { TicketCard } from "~/components/TicketCard";
import { TicketIcon, QRIcon } from "~/components/Icons";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  // Get shop from URL params (passed by Shopify in embedded context)
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop") || url.searchParams.get("embedded") || "";

  if (!shop) {
    return json({
      tickets: [],
      stats: { total: 0, valid: 0, scanned: 0, pending: 0 },
      shop: "",
    });
  }

  try {
    const { tickets, total } = await getTicketsByShop(shop, {
      limit: 20,
    });

    // Calculate stats
    const stats = {
      total,
      valid: tickets.filter((t) => t.status === "VALID").length,
      scanned: tickets.filter((t) => t.status === "SCANNED").length,
      pending: tickets.filter((t) => t.status === "PENDING").length,
    };

    return json({
      tickets,
      stats,
      shop,
    });
  } catch (error) {
    return json({
      tickets: [],
      stats: { total: 0, valid: 0, scanned: 0, pending: 0 },
      shop,
    });
  }
};

export default function Index() {
  const { tickets, stats, shop } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const [selectedQR, setSelectedQR] = useState<string | null>(null);

  const navigateWithShop = (path: string) => {
    navigate(`${path}?shop=${shop}`);
  };

  return (
    <Page
      title="Validiam - Ticket Management"
      subtitle="Manage event tickets and QR codes"
      primaryAction={{
        content: "Settings",
        onAction: () => navigateWithShop("/app/settings"),
      }}
      secondaryActions={[
        {
          content: "All Tickets",
          onAction: () => navigateWithShop("/app/tickets"),
        },
        {
          content: "Export CSV",
          onAction: () => navigateWithShop("/app/export"),
        },
      ]}
    >
      <Layout>
        <Layout.Section>
          <BlockStack gap="500">
            {/* Stats Cards */}
            <InlineGrid columns={{ xs: 1, sm: 2, md: 4 }} gap="400">
              <Card>
                <BlockStack gap="200">
                  <InlineStack align="space-between" blockAlign="center">
                    <Text as="p" variant="bodyMd" tone="subdued">
                      Total Tickets
                    </Text>
                    <TicketIcon />
                  </InlineStack>
                  <Text as="h3" variant="headingXl" fontWeight="bold">
                    {stats.total}
                  </Text>
                </BlockStack>
              </Card>

              <Card>
                <BlockStack gap="200">
                  <InlineStack align="space-between" blockAlign="center">
                    <Text as="p" variant="bodyMd" tone="subdued">
                      Valid
                    </Text>
                    <Badge tone="success">Active</Badge>
                  </InlineStack>
                  <Text as="h3" variant="headingXl" fontWeight="bold">
                    {stats.valid}
                  </Text>
                </BlockStack>
              </Card>

              <Card>
                <BlockStack gap="200">
                  <InlineStack align="space-between" blockAlign="center">
                    <Text as="p" variant="bodyMd" tone="subdued">
                      Scanned
                    </Text>
                    <QRIcon />
                  </InlineStack>
                  <Text as="h3" variant="headingXl" fontWeight="bold">
                    {stats.scanned}
                  </Text>
                </BlockStack>
              </Card>

              <Card>
                <BlockStack gap="200">
                  <InlineStack align="space-between" blockAlign="center">
                    <Text as="p" variant="bodyMd" tone="subdued">
                      Pending
                    </Text>
                    <Badge tone="attention">Pending</Badge>
                  </InlineStack>
                  <Text as="h3" variant="headingXl" fontWeight="bold">
                    {stats.pending}
                  </Text>
                </BlockStack>
              </Card>
            </InlineGrid>

            {/* Recent Tickets */}
            <Card>
              <BlockStack gap="400">
                <InlineStack align="space-between" blockAlign="center">
                  <Text as="h2" variant="headingLg" fontWeight="semibold">
                    Recent Tickets
                  </Text>
                  <Button onClick={() => navigateWithShop("/app/tickets")}>View All</Button>
                </InlineStack>

                {tickets.length === 0 ? (
                  <Box padding="800">
                    <BlockStack gap="400" inlineAlign="center">
                      <TicketIcon className="w-16 h-16 text-gray-400" />
                      <Text as="p" variant="bodyLg" tone="subdued" alignment="center">
                        No tickets yet
                      </Text>
                      <Text as="p" variant="bodySm" tone="subdued" alignment="center">
                        Tickets will appear here when customers purchase products tagged as
                        "ticket"
                      </Text>
                    </BlockStack>
                  </Box>
                ) : (
                  <BlockStack gap="400">
                    {tickets.slice(0, 5).map((ticket) => (
                      <TicketCard
                        key={ticket.id}
                        ticket={ticket}
                        onViewQR={setSelectedQR}
                      />
                    ))}
                  </BlockStack>
                )}
              </BlockStack>
            </Card>
          </BlockStack>
        </Layout.Section>

        <Layout.Section variant="oneThird">
          <BlockStack gap="400">
            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd" fontWeight="semibold">
                  Quick Actions
                </Text>
                <BlockStack gap="200">
                  <Button fullWidth variant="primary" onClick={() => navigateWithShop("/app/setup")}>
                    🔧 Setup & Webhooks
                  </Button>
                  <Button fullWidth onClick={() => navigateWithShop("/app/debug-order")}>
                    🔍 Debug Order
                  </Button>
                  <Button fullWidth onClick={() => navigateWithShop("/app/tickets")}>
                    View All Tickets
                  </Button>
                  <Button fullWidth onClick={() => navigateWithShop("/app/settings")}>
                    Configure Settings
                  </Button>
                  <Button fullWidth onClick={() => navigateWithShop("/app/export")}>
                    Export Data
                  </Button>
                </BlockStack>
              </BlockStack>
            </Card>

            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd" fontWeight="semibold">
                  How It Works
                </Text>
                <BlockStack gap="300">
                  <Text as="p" variant="bodySm">
                    1. Tag your products with "ticket" or "entrada"
                  </Text>
                  <Text as="p" variant="bodySm">
                    2. When customers purchase, QR codes are generated automatically
                  </Text>
                  <Text as="p" variant="bodySm">
                    3. Customers receive QR codes via email
                  </Text>
                  <Text as="p" variant="bodySm">
                    4. Scan QR codes with the Validiam mobile app at your event
                  </Text>
                </BlockStack>
              </BlockStack>
            </Card>
          </BlockStack>
        </Layout.Section>
      </Layout>

      {/* QR Code Modal */}
      <Modal
        open={selectedQR !== null}
        onClose={() => setSelectedQR(null)}
        title="Ticket QR Code"
      >
        <Modal.Section>
          <Box padding="400">
            <BlockStack gap="400" inlineAlign="center">
              {selectedQR && (
                <img
                  src={selectedQR}
                  alt="QR Code"
                  style={{ maxWidth: "400px", width: "100%", height: "auto" }}
                />
              )}
              <Text as="p" variant="bodySm" tone="subdued" alignment="center">
                Scan this QR code at the event entrance
              </Text>
            </BlockStack>
          </Box>
        </Modal.Section>
      </Modal>
    </Page>
  );
}
