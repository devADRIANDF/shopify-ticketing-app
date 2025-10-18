import { json, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useSubmit, useNavigation, useActionData } from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  BlockStack,
  Button,
  Banner,
  Text,
  List,
} from "@shopify/polaris";
import { useState, useCallback, useEffect } from "react";
import { authenticate } from "~/shopify.server";
import { prisma } from "~/lib/db.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  try {
    const { admin, session } = await authenticate.admin(request);

    // Check if webhooks are registered
    const webhooksResponse = await admin.rest.resources.Webhook.all({
      session,
    });

    const webhooks = webhooksResponse.data || [];
    const ordersCreateWebhook = webhooks.find(
      (w: any) => w.topic === "orders/create"
    );

    // Check if settings exist
    const settings = await prisma.appSettings.findUnique({
      where: { shop: session.shop },
    });

    return json({
      shop: session.shop,
      webhookRegistered: !!ordersCreateWebhook,
      webhookDetails: ordersCreateWebhook || null,
      settingsExist: !!settings,
      settings,
    });
  } catch (error: any) {
    console.error("Setup loader error:", error);

    // Extract meaningful error message
    let errorMessage = "Unknown error occurred";

    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (error?.message) {
      errorMessage = error.message;
    } else if (typeof error === "string") {
      errorMessage = error;
    } else if (error?.toString && error.toString() !== "[object Object]") {
      errorMessage = error.toString();
    }

    return json({
      shop: "",
      webhookRegistered: false,
      webhookDetails: null,
      settingsExist: false,
      settings: null,
      error: errorMessage,
    });
  }
};

export const action = async ({ request }: ActionFunctionArgs) => {
  try {
    const { admin, session } = await authenticate.admin(request);
    const formData = await request.formData();
    const action = formData.get("action");

    if (action === "registerWebhook") {
      // Register orders/create webhook
      const webhook = new admin.rest.resources.Webhook({ session });
      webhook.topic = "orders/create";
      webhook.address = `${process.env.SHOPIFY_APP_URL}/api/webhooks/orders/create`;
      webhook.format = "json";

      await webhook.save({
        update: true,
      });

      return json({ success: true, message: "Webhook registered successfully" });
    }

    if (action === "createSettings") {
      // Create default settings
      await prisma.appSettings.upsert({
        where: { shop: session.shop },
        update: {},
        create: {
          shop: session.shop,
          ticketTag: "ticket",
          autoEmailEnabled: true,
          brandColor: "#5C6AC4",
        },
      });

      return json({ success: true, message: "Settings created successfully" });
    }

    return json({ success: false, message: "Unknown action" });
  } catch (error: any) {
    console.error("Setup action error:", error);

    // Extract meaningful error message
    let errorMessage = "Unknown error occurred";

    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (error?.message) {
      errorMessage = error.message;
    } else if (typeof error === "string") {
      errorMessage = error;
    } else if (error?.toString && error.toString() !== "[object Object]") {
      errorMessage = error.toString();
    }

    return json({
      success: false,
      error: errorMessage,
      details: process.env.NODE_ENV === "development" ? String(error) : undefined
    }, { status: 500 });
  }
};

export default function SetupPage() {
  const data = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const submit = useSubmit();
  const navigation = useNavigation();
  const [showSuccess, setShowSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Get shop from URL to preserve in navigation
  const url = typeof window !== 'undefined' ? new URL(window.location.href) : null;
  const shop = url?.searchParams.get("shop") || "";

  const isLoading = navigation.state === "submitting";

  // Handle action response
  useEffect(() => {
    if (actionData) {
      if (actionData.success) {
        setShowSuccess(true);
        setErrorMessage("");
        setTimeout(() => setShowSuccess(false), 3000);
      } else {
        setErrorMessage(actionData.error || actionData.message || "Unknown error occurred");
        setShowSuccess(false);
      }
    }
  }, [actionData]);

  const handleRegisterWebhook = useCallback(() => {
    setErrorMessage(""); // Clear any previous errors
    const formData = new FormData();
    formData.append("action", "registerWebhook");
    submit(formData, { method: "post" });
  }, [submit]);

  const handleCreateSettings = useCallback(() => {
    setErrorMessage(""); // Clear any previous errors
    const formData = new FormData();
    formData.append("action", "createSettings");
    submit(formData, { method: "post" });
  }, [submit]);

  return (
    <Page
      title="App Setup"
      subtitle="Configure webhooks and settings"
      backAction={{ content: "Dashboard", url: `/app?shop=${shop}` }}
    >
      <Layout>
        <Layout.Section>
          <BlockStack gap="500">
            {showSuccess && (
              <Banner tone="success" onDismiss={() => setShowSuccess(false)}>
                Action completed successfully
              </Banner>
            )}

            {errorMessage && (
              <Banner tone="critical" onDismiss={() => setErrorMessage("")}>
                Error: {errorMessage}
              </Banner>
            )}

            {data.error && (
              <Banner tone="critical">
                Error loading setup page: {data.error}
              </Banner>
            )}

            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd" fontWeight="semibold">
                  Webhook Status
                </Text>

                <List>
                  <List.Item>
                    Shop: <strong>{data.shop || "Not detected"}</strong>
                  </List.Item>
                  <List.Item>
                    Orders/Create Webhook: {" "}
                    {data.webhookRegistered ? (
                      <strong style={{ color: "green" }}>✓ Registered</strong>
                    ) : (
                      <strong style={{ color: "red" }}>✗ Not Registered</strong>
                    )}
                  </List.Item>
                  {data.webhookDetails && (
                    <List.Item>
                      Webhook URL: <strong>{data.webhookDetails.address}</strong>
                    </List.Item>
                  )}
                </List>

                {!data.webhookRegistered && (
                  <Button
                    onClick={handleRegisterWebhook}
                    loading={isLoading}
                    variant="primary"
                  >
                    Register Orders Webhook
                  </Button>
                )}
              </BlockStack>
            </Card>

            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd" fontWeight="semibold">
                  App Settings
                </Text>

                <List>
                  <List.Item>
                    Settings: {" "}
                    {data.settingsExist ? (
                      <strong style={{ color: "green" }}>✓ Configured</strong>
                    ) : (
                      <strong style={{ color: "red" }}>✗ Not Configured</strong>
                    )}
                  </List.Item>
                  {data.settings && (
                    <>
                      <List.Item>Ticket Tag: <strong>{data.settings.ticketTag}</strong></List.Item>
                      <List.Item>
                        Auto Email: <strong>{data.settings.autoEmailEnabled ? "Enabled" : "Disabled"}</strong>
                      </List.Item>
                    </>
                  )}
                </List>

                {!data.settingsExist && (
                  <Button
                    onClick={handleCreateSettings}
                    loading={isLoading}
                  >
                    Create Default Settings
                  </Button>
                )}
              </BlockStack>
            </Card>

            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd" fontWeight="semibold">
                  Instructions
                </Text>
                <List type="number">
                  <List.Item>
                    Make sure the webhook is registered (click button above if not)
                  </List.Item>
                  <List.Item>
                    Make sure settings are configured (click button above if not)
                  </List.Item>
                  <List.Item>
                    Tag your products with "ticket" in Shopify
                  </List.Item>
                  <List.Item>
                    Create a test order with a ticket product
                  </List.Item>
                  <List.Item>
                    Check the Tickets page to see if QR codes were generated
                  </List.Item>
                </List>
              </BlockStack>
            </Card>
          </BlockStack>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
