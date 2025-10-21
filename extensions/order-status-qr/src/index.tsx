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
  const { orderConfirmation, shop } = useApi();
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTickets() {
      try {
        console.log("[QR Extension] Order confirmation:", orderConfirmation);
        console.log("[QR Extension] Order confirmation.current:", orderConfirmation?.current);
        console.log("[QR Extension] Shop:", shop);

        // Get the order ID and number
        let orderId = orderConfirmation?.current?.order?.id;
        let orderNumber = orderConfirmation?.current?.number;

        console.log("[QR Extension] Order ID found:", orderId);
        console.log("[QR Extension] Order number found:", orderNumber);

        if (!orderId && !orderNumber) {
          console.log("[QR Extension] No order ID or number found");
          setLoading(false);
          return;
        }

        // Extract numeric order ID from the full ID if available
        const numericOrderId = orderId ? orderId.split('/').pop() : null;
        console.log("[QR Extension] Fetching tickets for order:", { numericOrderId, orderNumber });

        // Fetch tickets from the app API - try both ID and order number
        const params = new URLSearchParams();
        if (numericOrderId) params.append("orderId", numericOrderId);
        if (orderNumber) params.append("orderNumber", orderNumber);

        const response = await fetch(
          `https://shopify-ticketing-app.onrender.com/api/tickets/by-order?${params.toString()}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        console.log("[QR Extension] Received tickets:", data);

        if (data.tickets && Array.isArray(data.tickets) && data.tickets.length > 0) {
          // Map tickets to the format expected by the UI
          const formattedTickets = data.tickets.map((ticket: any) => ({
            id: ticket.id,
            productTitle: ticket.productTitle,
            shopifyOrderName: ticket.shopifyOrderName,
            qrCodeDataUrl: ticket.qrCode,
            status: ticket.status,
          }));
          setTickets(formattedTickets);
        }

        setLoading(false);
      } catch (err) {
        console.error("[QR Extension] Error fetching tickets:", err);
        setError(err instanceof Error ? err.message : "Failed to load tickets");
        setLoading(false);
      }
    }

    fetchTickets();
  }, [orderConfirmation, shop]);

  // Don't render anything if no tickets
  if (loading) return null;
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
