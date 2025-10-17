import { json, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useSubmit, useNavigation } from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  BlockStack,
  TextField,
  Checkbox,
  Button,
  Banner,
  FormLayout,
} from "@shopify/polaris";
import { useState, useCallback, useEffect } from "react";
import { authenticate } from "~/shopify.server";
import { prisma } from "~/lib/db.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);

  const settings = await prisma.appSettings.findUnique({
    where: { shop: session.shop },
  });

  return json({
    settings: settings || {
      ticketTag: "ticket",
      autoEmailEnabled: true,
      brandColor: "#5C6AC4",
      brandLogo: "",
    },
  });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();

  const ticketTag = formData.get("ticketTag") as string;
  const autoEmailEnabled = formData.get("autoEmailEnabled") === "true";
  const brandColor = formData.get("brandColor") as string;
  const brandLogo = formData.get("brandLogo") as string;

  await prisma.appSettings.upsert({
    where: { shop: session.shop },
    update: {
      ticketTag,
      autoEmailEnabled,
      brandColor,
      brandLogo,
    },
    create: {
      shop: session.shop,
      ticketTag,
      autoEmailEnabled,
      brandColor,
      brandLogo,
    },
  });

  return json({ success: true });
};

export default function SettingsPage() {
  const { settings } = useLoaderData<typeof loader>();
  const submit = useSubmit();
  const navigation = useNavigation();

  const [ticketTag, setTicketTag] = useState(settings.ticketTag);
  const [autoEmailEnabled, setAutoEmailEnabled] = useState(settings.autoEmailEnabled);
  const [brandColor, setBrandColor] = useState(settings.brandColor);
  const [brandLogo, setBrandLogo] = useState(settings.brandLogo || "");
  const [showSuccessBanner, setShowSuccessBanner] = useState(false);

  const isLoading = navigation.state === "submitting";

  useEffect(() => {
    if (navigation.state === "idle" && navigation.formData) {
      setShowSuccessBanner(true);
      setTimeout(() => setShowSuccessBanner(false), 3000);
    }
  }, [navigation.state, navigation.formData]);

  const handleSave = useCallback(() => {
    const formData = new FormData();
    formData.append("ticketTag", ticketTag);
    formData.append("autoEmailEnabled", autoEmailEnabled.toString());
    formData.append("brandColor", brandColor);
    formData.append("brandLogo", brandLogo);

    submit(formData, { method: "post" });
  }, [ticketTag, autoEmailEnabled, brandColor, brandLogo, submit]);

  return (
    <Page
      title="Settings"
      subtitle="Configure your ticket system"
      backAction={{ content: "Dashboard", url: "/app" }}
    >
      <Layout>
        <Layout.Section>
          <BlockStack gap="500">
            {showSuccessBanner && (
              <Banner tone="success" onDismiss={() => setShowSuccessBanner(false)}>
                Settings saved successfully
              </Banner>
            )}

            <Card>
              <BlockStack gap="400">
                <FormLayout>
                  <TextField
                    label="Ticket Tag"
                    value={ticketTag}
                    onChange={setTicketTag}
                    helpText="Products with this tag will be treated as tickets (e.g., 'ticket', 'entrada')"
                    autoComplete="off"
                  />

                  <Checkbox
                    label="Automatically send tickets via email"
                    checked={autoEmailEnabled}
                    onChange={setAutoEmailEnabled}
                    helpText="When enabled, customers will receive their QR codes by email after purchase"
                  />

                  <TextField
                    label="Brand Color"
                    type="color"
                    value={brandColor}
                    onChange={setBrandColor}
                    helpText="This color will be used in ticket emails"
                    autoComplete="off"
                  />

                  <TextField
                    label="Brand Logo URL"
                    value={brandLogo}
                    onChange={setBrandLogo}
                    placeholder="https://example.com/logo.png"
                    helpText="URL to your logo image for ticket emails (optional)"
                    autoComplete="off"
                  />
                </FormLayout>

                <Button
                  variant="primary"
                  onClick={handleSave}
                  loading={isLoading}
                  size="large"
                >
                  Save Settings
                </Button>
              </BlockStack>
            </Card>

            <Card>
              <BlockStack gap="400">
                <text as="h2" variant="headingMd" fontWeight="semibold">
                  Setup Instructions
                </text>
                <BlockStack gap="300">
                  <text as="p" variant="bodySm">
                    <strong>Step 1:</strong> Tag your event/ticket products with "{ticketTag}" in
                    Shopify
                  </text>
                  <text as="p" variant="bodySm">
                    <strong>Step 2:</strong> When customers purchase these products, QR codes
                    will be generated automatically
                  </text>
                  <text as="p" variant="bodySm">
                    <strong>Step 3:</strong> Customers receive QR codes via email (if enabled)
                  </text>
                  <text as="p" variant="bodySm">
                    <strong>Step 4:</strong> Use the Validiam mobile app to scan QR codes at your
                    event
                  </text>
                </BlockStack>
              </BlockStack>
            </Card>
          </BlockStack>
        </Layout.Section>

        <Layout.Section variant="oneThird">
          <Card>
            <BlockStack gap="400">
              <text as="h2" variant="headingMd" fontWeight="semibold">
                Email Configuration
              </text>
              <BlockStack gap="200">
                <text as="p" variant="bodySm" tone="subdued">
                  Email settings are configured through environment variables.
                </text>
                <text as="p" variant="bodySm" tone="subdued">
                  Contact your administrator to update SMTP settings if needed.
                </text>
              </BlockStack>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
