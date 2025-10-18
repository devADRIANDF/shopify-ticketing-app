import React, { useEffect, useState } from "react";
import {
  reactExtension,
  useApi,
  useMetafield,
  BlockStack,
  Heading,
  Image,
  Text,
  Banner,
  InlineLayout,
} from "@shopify/ui-extensions-react/checkout";

export default reactExtension("purchase.thank-you.block.render", () => <Extension />);

function Extension() {
  const { orderConfirmation } = useApi();
  const ticketsMetafield = useMetafield({
    namespace: "validiam",
    key: "tickets",
  });
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("[QR Extension] Order confirmation:", orderConfirmation);
    console.log("[QR Extension] Tickets metafield:", ticketsMetafield);

    if (ticketsMetafield?.value) {
      try {
        const ticketsData = JSON.parse(ticketsMetafield.value);
        console.log("[QR Extension] Parsed tickets data:", ticketsData);

        if (Array.isArray(ticketsData) && ticketsData.length > 0) {
          setTickets(ticketsData);
        }
      } catch (err) {
        console.error("[QR Extension] Error parsing tickets metafield:", err);
      }
    } else {
      console.log("[QR Extension] No tickets metafield found");
    }

    setLoading(false);
  }, [ticketsMetafield, orderConfirmation]);

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
