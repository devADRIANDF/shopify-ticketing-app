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
    async function fetchTickets(retryCount = 0) {
      try {
        // Get order ID from checkout
        const order = extension.target.order;
        console.log("[QR Extension] Order object:", order);

        if (!order?.id) {
          console.log("[QR Extension] No order ID found");
          setLoading(false);
          return;
        }

        // Extract numeric ID from GraphQL ID (e.g., "gid://shopify/Order/123" -> "123")
        const orderId = order.id.split("/").pop();
        console.log("[QR Extension] Fetching tickets for order:", orderId, "shop:", shop.myshopifyDomain);

        // Fetch tickets from our app
        const appUrl = "https://shopify-ticketing-app.onrender.com";
        const url = `${appUrl}/api/tickets/by-order?orderId=${orderId}&shop=${shop.myshopifyDomain}`;
        console.log("[QR Extension] Fetching from:", url);

        const response = await fetch(url);

        if (!response.ok) {
          console.error("[QR Extension] Response not OK:", response.status, response.statusText);
          throw new Error(`Failed to load tickets: ${response.status}`);
        }

        const data = await response.json();
        console.log("[QR Extension] Received data:", data);

        if (data.tickets && data.tickets.length > 0) {
          setTickets(data.tickets);
        } else if (retryCount < 3) {
          // Retry after 2 seconds if no tickets found (webhook might still be processing)
          console.log("[QR Extension] No tickets found, retrying in 2s... (attempt", retryCount + 1, "/3)");
          setTimeout(() => fetchTickets(retryCount + 1), 2000);
          return;
        } else {
          console.log("[QR Extension] No tickets found after 3 retries");
        }
      } catch (err) {
        console.error("[QR Extension] Error fetching tickets:", err);
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
