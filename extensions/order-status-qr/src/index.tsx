import React, { useEffect, useState } from "react";
import {
  reactExtension,
  useApi,
  BlockStack,
  Heading,
  Image,
  Text,
  Banner,
  InlineLayout,
} from "@shopify/ui-extensions-react/checkout";

export default reactExtension("purchase.thank-you.block.render", () => <Extension />);

function Extension() {
  const { extension, shop } = useApi();
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchTickets() {
      try {
        // Get order ID from checkout
        const order = extension.target.order;
        if (!order?.id) {
          setLoading(false);
          return;
        }

        // Extract numeric ID from GraphQL ID (e.g., "gid://shopify/Order/123" -> "123")
        const orderId = order.id.split("/").pop();

        // Fetch tickets from our app
        const appUrl = "https://shopify-ticketing-app.onrender.com";
        const response = await fetch(
          `${appUrl}/api/tickets/by-order?orderId=${orderId}&shop=${shop.myshopifyDomain}`
        );

        if (!response.ok) {
          throw new Error("Failed to load tickets");
        }

        const data = await response.json();
        setTickets(data.tickets || []);
      } catch (err) {
        console.error("Error fetching tickets:", err);
        setError("Unable to load tickets");
      } finally {
        setLoading(false);
      }
    }

    fetchTickets();
  }, [extension, shop]);

  // Don't render anything if no tickets
  if (loading) return null;
  if (error) return null;
  if (tickets.length === 0) return null;

  return (
    <BlockStack spacing="loose">
      <Banner title="Your Event Tickets" status="success">
        Your tickets are ready! We've also sent them to your email.
      </Banner>

      <Heading level={2}>Event Tickets</Heading>

      <BlockStack spacing="base">
        {tickets.map((ticket) => (
          <BlockStack key={ticket.id} spacing="tight" border="base" padding="base" cornerRadius="base">
            <Text size="medium" emphasis="bold">
              {ticket.productTitle}
            </Text>
            <Text size="small" appearance="subdued">
              Order: {ticket.shopifyOrderName}
            </Text>

            {ticket.qrCodeDataUrl && (
              <InlineLayout columns={["fill", "auto"]} spacing="base">
                <BlockStack spacing="tight">
                  <Text size="small">
                    Scan this QR code at the event entrance
                  </Text>
                  <Text size="small" appearance="subdued">
                    Ticket ID: {ticket.id.substring(0, 8)}
                  </Text>
                </BlockStack>
                <Image
                  source={ticket.qrCodeDataUrl}
                  accessibilityDescription="Event ticket QR code"
                  border="base"
                />
              </InlineLayout>
            )}
          </BlockStack>
        ))}
      </BlockStack>

      <Text size="small" appearance="subdued">
        💡 Tip: Save these QR codes or check your email for easy access on event day.
      </Text>
    </BlockStack>
  );
}
