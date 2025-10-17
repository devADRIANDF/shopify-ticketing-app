import { json, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useSubmit, useNavigation } from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  BlockStack,
  Select,
  Button,
  Text,
  Banner,
  FormLayout,
} from "@shopify/polaris";
import { useState, useCallback, useEffect } from "react";
import { authenticate } from "~/shopify.server";
import { exportTicketsToCSV } from "~/services/ticket.server";
import type { TicketStatus } from "@prisma/client";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  return json({ shop: session.shop });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();

  const status = formData.get("status") as TicketStatus | null;
  const startDateStr = formData.get("startDate") as string | null;
  const endDateStr = formData.get("endDate") as string | null;

  const filters: any = {};

  if (status && status !== "all") {
    filters.status = status as TicketStatus;
  }

  if (startDateStr) {
    filters.startDate = new Date(startDateStr);
  }

  if (endDateStr) {
    filters.endDate = new Date(endDateStr);
  }

  const csvData = await exportTicketsToCSV(session.shop, filters);

  return new Response(csvData, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="validiam-tickets-${Date.now()}.csv"`,
    },
  });
};

export default function ExportPage() {
  const navigation = useNavigation();
  const submit = useSubmit();

  const [status, setStatus] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const isExporting = navigation.state === "submitting";

  const handleExport = useCallback(() => {
    const formData = new FormData();
    formData.append("status", status);
    if (startDate) formData.append("startDate", startDate);
    if (endDate) formData.append("endDate", endDate);

    submit(formData, { method: "post" });
  }, [status, startDate, endDate, submit]);

  return (
    <Page
      title="Export Tickets"
      subtitle="Download ticket data as CSV"
      backAction={{ content: "Dashboard", url: "/app" }}
    >
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="500">
              <Text as="h2" variant="headingMd" fontWeight="semibold">
                Export Options
              </Text>

              <FormLayout>
                <Select
                  label="Filter by Status"
                  options={[
                    { label: "All Statuses", value: "all" },
                    { label: "Pending", value: "PENDING" },
                    { label: "Valid", value: "VALID" },
                    { label: "Scanned", value: "SCANNED" },
                    { label: "Invalid", value: "INVALID" },
                    { label: "Cancelled", value: "CANCELLED" },
                  ]}
                  value={status}
                  onChange={setStatus}
                />

                <FormLayout.Group>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    style={{
                      padding: "8px",
                      border: "1px solid #c9cccf",
                      borderRadius: "4px",
                      width: "100%",
                    }}
                    placeholder="Start Date"
                  />
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    style={{
                      padding: "8px",
                      border: "1px solid #c9cccf",
                      borderRadius: "4px",
                      width: "100%",
                    }}
                    placeholder="End Date"
                  />
                </FormLayout.Group>
              </FormLayout>

              <Button
                variant="primary"
                onClick={handleExport}
                loading={isExporting}
                size="large"
              >
                Export to CSV
              </Button>
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section variant="oneThird">
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd" fontWeight="semibold">
                About CSV Export
              </Text>
              <BlockStack gap="300">
                <Text as="p" variant="bodySm">
                  The CSV file will include the following information:
                </Text>
                <BlockStack gap="100">
                  <Text as="p" variant="bodySm" tone="subdued">
                    • Ticket ID
                  </Text>
                  <Text as="p" variant="bodySm" tone="subdued">
                    • Order Number
                  </Text>
                  <Text as="p" variant="bodySm" tone="subdued">
                    • Product Details
                  </Text>
                  <Text as="p" variant="bodySm" tone="subdued">
                    • Buyer Information
                  </Text>
                  <Text as="p" variant="bodySm" tone="subdued">
                    • Status
                  </Text>
                  <Text as="p" variant="bodySm" tone="subdued">
                    • Scan Details
                  </Text>
                </BlockStack>
              </BlockStack>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
