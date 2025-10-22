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
        console.log("[QR Extension] All available fields:", JSON.stringify(orderConfirmation?.current, null, 2));
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

        const apiUrl = `https://shopify-ticketing-app.onrender.com/api/tickets/by-order?${params.toString()}`;

        // Retry logic: webhook might not have created tickets yet
        // Shopify webhooks can take 25-30 seconds to process
        // Try up to 10 times with delays totaling ~45 seconds
        const maxRetries = 10;
        const delays = [2000, 3000, 3000, 4000, 4000, 5000, 5000, 5000, 5000, 5000]; // Total: ~45s

        for (let attempt = 0; attempt < maxRetries; attempt++) {
          console.log(`[QR Extension] Fetch attempt ${attempt + 1}/${maxRetries}`);

          const response = await fetch(apiUrl, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          });

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }

          const data = await response.json();
          console.log(`[QR Extension] Attempt ${attempt + 1} received:`, data);

          if (data.tickets && Array.isArray(data.tickets) && data.tickets.length > 0) {
            // Success! We found tickets
            console.log("[QR Extension] ✅ Found tickets!");
            const formattedTickets = data.tickets.map((ticket: any) => ({
              id: ticket.id,
              productTitle: ticket.productTitle,
              shopifyOrderName: ticket.shopifyOrderName,
              qrCodeDataUrl: ticket.qrCodeDataUrl, // Use qrCodeDataUrl from API (was ticket.qrCode before)
              status: ticket.status,
            }));
            console.log("[QR Extension] Formatted tickets with QR URLs:", formattedTickets.map(t => ({ id: t.id, qrUrl: t.qrCodeDataUrl })));
            setTickets(formattedTickets);
            setLoading(false);
            return;
          }

          // No tickets yet, wait before retrying (unless this was the last attempt)
          if (attempt < maxRetries - 1) {
            console.log(`[QR Extension] No tickets yet, waiting ${delays[attempt]}ms before retry...`);
            await new Promise(resolve => setTimeout(resolve, delays[attempt]));
          }
        }

        // If we get here, we tried all retries and found no tickets
        console.log("[QR Extension] ⚠️ No tickets found after all retries");
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
