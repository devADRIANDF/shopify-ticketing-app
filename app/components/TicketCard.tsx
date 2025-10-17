import { Badge, Card, Text, BlockStack, InlineStack, Button } from "@shopify/polaris";
import type { TicketStatus } from "@prisma/client";

interface TicketCardProps {
  ticket: {
    id: string;
    shopifyOrderName: string;
    productTitle: string;
    variantTitle?: string | null;
    buyerEmail: string;
    buyerName?: string | null;
    ticketType: string;
    status: TicketStatus;
    createdAt: Date;
    scannedAt?: Date | null;
    qrCode: string;
  };
  onViewQR?: (qrCode: string) => void;
}

const statusBadgeMap: Record<TicketStatus, "success" | "attention" | "warning" | "critical"> = {
  PENDING: "attention",
  VALID: "success",
  SCANNED: "warning",
  INVALID: "critical",
  CANCELLED: "critical",
};

export function TicketCard({ ticket, onViewQR }: TicketCardProps) {
  return (
    <Card>
      <BlockStack gap="400">
        <InlineStack align="space-between" blockAlign="center">
          <Text as="h3" variant="headingMd" fontWeight="semibold">
            {ticket.ticketType}
          </Text>
          <Badge tone={statusBadgeMap[ticket.status]}>{ticket.status}</Badge>
        </InlineStack>

        <BlockStack gap="200">
          <InlineStack gap="200">
            <Text as="span" variant="bodySm" tone="subdued">
              Ticket ID:
            </Text>
            <Text as="span" variant="bodySm" fontWeight="semibold">
              {ticket.id}
            </Text>
          </InlineStack>

          <InlineStack gap="200">
            <Text as="span" variant="bodySm" tone="subdued">
              Order:
            </Text>
            <Text as="span" variant="bodySm" fontWeight="semibold">
              {ticket.shopifyOrderName}
            </Text>
          </InlineStack>

          <InlineStack gap="200">
            <Text as="span" variant="bodySm" tone="subdued">
              Product:
            </Text>
            <Text as="span" variant="bodySm" fontWeight="medium">
              {ticket.productTitle}
              {ticket.variantTitle && ` - ${ticket.variantTitle}`}
            </Text>
          </InlineStack>

          <InlineStack gap="200">
            <Text as="span" variant="bodySm" tone="subdued">
              Buyer:
            </Text>
            <Text as="span" variant="bodySm">
              {ticket.buyerName || ticket.buyerEmail}
            </Text>
          </InlineStack>

          <InlineStack gap="200">
            <Text as="span" variant="bodySm" tone="subdued">
              Created:
            </Text>
            <Text as="span" variant="bodySm">
              {new Date(ticket.createdAt).toLocaleDateString()}
            </Text>
          </InlineStack>

          {ticket.scannedAt && (
            <InlineStack gap="200">
              <Text as="span" variant="bodySm" tone="subdued">
                Scanned:
              </Text>
              <Text as="span" variant="bodySm">
                {new Date(ticket.scannedAt).toLocaleString()}
              </Text>
            </InlineStack>
          )}
        </BlockStack>

        {onViewQR && (
          <InlineStack align="end">
            <Button onClick={() => onViewQR(ticket.qrCode)} size="slim">
              View QR Code
            </Button>
          </InlineStack>
        )}
      </BlockStack>
    </Card>
  );
}
