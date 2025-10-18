import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useSearchParams, useNavigate } from "@remix-run/react";
import {
  Page,
  Card,
  BlockStack,
  TextField,
  Select,
  InlineStack,
  Pagination,
  Modal,
  Box,
  Text,
  Button,
} from "@shopify/polaris";
import { useState, useCallback } from "react";
import { authenticate } from "~/shopify.server";
import { getTicketsByShop } from "~/services/ticket.server";
import { TicketCard } from "~/components/TicketCard";
import type { TicketStatus } from "@prisma/client";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop") || "";

  if (!shop) {
    return json({
      tickets: [],
      total: 0,
      page: 1,
      totalPages: 0,
      currentStatus: "all",
    });
  }

  const page = parseInt(url.searchParams.get("page") || "1");
  const status = url.searchParams.get("status") as TicketStatus | undefined;
  const limit = 20;
  const offset = (page - 1) * limit;

  const { tickets, total } = await getTicketsByShop(shop, {
    status: status || undefined,
    limit,
    offset,
  });

  return json({
    tickets,
    total,
    page,
    totalPages: Math.ceil(total / limit),
    currentStatus: status || "all",
  });
};

export default function TicketsPage() {
  const { tickets, total, page, totalPages, currentStatus } =
    useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [selectedQR, setSelectedQR] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Get shop from URL to preserve in navigation
  const shop = searchParams.get("shop") || "";

  const handleStatusChange = useCallback(
    (value: string) => {
      const newParams = new URLSearchParams(searchParams);
      if (value === "all") {
        newParams.delete("status");
      } else {
        newParams.set("status", value);
      }
      newParams.set("page", "1");
      setSearchParams(newParams);
    },
    [searchParams, setSearchParams]
  );

  const handlePageChange = useCallback(
    (newPage: number) => {
      const newParams = new URLSearchParams(searchParams);
      newParams.set("page", newPage.toString());
      setSearchParams(newParams);
    },
    [searchParams, setSearchParams]
  );

  const filteredTickets = tickets.filter((ticket) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      ticket.id.toLowerCase().includes(query) ||
      ticket.shopifyOrderName.toLowerCase().includes(query) ||
      ticket.buyerEmail.toLowerCase().includes(query) ||
      ticket.productTitle.toLowerCase().includes(query)
    );
  });

  return (
    <Page
      title="All Tickets"
      subtitle={`${total} total tickets`}
      backAction={{ content: "Dashboard", onAction: () => navigate(`/app?shop=${shop}`) }}
      primaryAction={{
        content: "Export CSV",
        onAction: () => navigate(`/app/export?shop=${shop}`),
      }}
    >
      <BlockStack gap="400">
        {/* Filters */}
        <Card>
          <BlockStack gap="400">
            <InlineStack gap="400" wrap={false}>
              <div style={{ flexGrow: 1 }}>
                <TextField
                  label="Search"
                  value={searchQuery}
                  onChange={setSearchQuery}
                  placeholder="Search by ticket ID, order, email, or product"
                  autoComplete="off"
                  clearButton
                  onClearButtonClick={() => setSearchQuery("")}
                />
              </div>
              <div style={{ minWidth: "200px" }}>
                <Select
                  label="Status"
                  options={[
                    { label: "All", value: "all" },
                    { label: "Pending", value: "PENDING" },
                    { label: "Valid", value: "VALID" },
                    { label: "Scanned", value: "SCANNED" },
                    { label: "Invalid", value: "INVALID" },
                    { label: "Cancelled", value: "CANCELLED" },
                  ]}
                  value={currentStatus}
                  onChange={handleStatusChange}
                />
              </div>
            </InlineStack>
          </BlockStack>
        </Card>

        {/* Tickets List */}
        <Card>
          <BlockStack gap="400">
            {filteredTickets.length === 0 ? (
              <Box padding="800">
                <Text as="p" variant="bodyLg" tone="subdued" alignment="center">
                  No tickets found
                </Text>
              </Box>
            ) : (
              <BlockStack gap="400">
                {filteredTickets.map((ticket) => (
                  <TicketCard
                    key={ticket.id}
                    ticket={ticket}
                    onViewQR={setSelectedQR}
                  />
                ))}
              </BlockStack>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <InlineStack align="center">
                <Pagination
                  hasPrevious={page > 1}
                  onPrevious={() => handlePageChange(page - 1)}
                  hasNext={page < totalPages}
                  onNext={() => handlePageChange(page + 1)}
                  label={`Page ${page} of ${totalPages}`}
                />
              </InlineStack>
            )}
          </BlockStack>
        </Card>
      </BlockStack>

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
              <Button
                onClick={() => {
                  const link = document.createElement("a");
                  link.href = selectedQR || "";
                  link.download = "ticket-qr-code.png";
                  link.click();
                }}
              >
                Download QR Code
              </Button>
            </BlockStack>
          </Box>
        </Modal.Section>
      </Modal>
    </Page>
  );
}
