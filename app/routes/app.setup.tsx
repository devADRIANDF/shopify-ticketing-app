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
    const url = new URL(request.url);
    const shop = url.searchParams.get("shop") || "";

    if (!shop) {
      return json({
        shop: "",
        webhookRegistered: false,
        webhookDetails: null,
        settingsExist: false,
        settings: null,
        error: "Shop parameter is missing. Please open the app from Shopify Admin.",
      });
    }

    // Check if settings exist
    const settings = await prisma.appSettings.findUnique({
      where: { shop },
    });

    // The webhook is automatically registered via shopify.app.toml
    return json({
      shop,
      webhookRegistered: true,
      webhookDetails: {
        address: `${process.env.SHOPIFY_APP_URL}/api/webhooks/orders/create`,
        topic: "orders/create",
      },
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
    const formData = await request.formData();
    const action = formData.get("action");
    const shop = formData.get("shop") as string;

    if (!shop) {
      return json({
        success: false,
        error: "Shop parameter is missing"
      }, { status: 400 });
    }

    if (action === "createSettings") {
      // Create default settings
      await prisma.appSettings.upsert({
        where: { shop },
        update: {},
        create: {
          shop,
          ticketTag: "ticket",
          autoEmailEnabled: true,
          brandColor: "#5C6AC4",
        },
      });

      return json({ success: true, message: "Settings created successfully" });
    }

    if (action === "setupMetafields") {
      try {
        console.log("[Setup] Setting up metafields for shop:", shop);

        // We need to use the admin API, so authenticate here
        const { admin } = await authenticate.admin(request);

        const mutation = `
          mutation CreateMetafieldDefinition {
            metafieldDefinitionCreate(
              definition: {
                name: "Tickets"
                namespace: "validiam"
                key: "tickets"
                description: "QR code tickets data for order"
                type: "json"
                ownerType: ORDER
              }
            ) {
              createdDefinition {
                id
                name
                namespace
                key
              }
              userErrors {
                field
                message
              }
            }
          }
        `;

        console.log("[Setup] Calling GraphQL mutation...");
        const response = await admin.graphql(mutation);
        const result = await response.json();

        console.log("[Setup] GraphQL result:", JSON.stringify(result, null, 2));

        if (result.data?.metafieldDefinitionCreate?.userErrors?.length > 0) {
          const errors = result.data.metafieldDefinitionCreate.userErrors;
          const errorMessage = errors[0]?.message || "";

          // Check if it already exists
          if (errorMessage.includes("taken") || errorMessage.includes("already exists")) {
            console.log("[Setup] Metafield already exists - OK");
            return json({
              success: true,
              message: "Metafield definition already exists"
            });
          }

          console.error("[Setup] User errors:", errors);
          return json({
            success: false,
            error: errors.map((e: any) => e.message).join(", ")
          });
        }

        console.log("[Setup] Metafield created successfully");
        return json({
          success: true,
          message: "Metafield definition created successfully"
        });
      } catch (metafieldError: any) {
        console.error("[Setup] Metafield setup error:", metafieldError);
        return json({
          success: false,
          error: metafieldError?.message || "Failed to setup metafields"
        });
      }
    }

    return json({ success: false, message: "Unknown action" });
  } catch (error: any) {
    console.error("Setup action error:", error);

    return json({
      success: false,
      error: error?.message || "An error occurred"
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

  const handleCreateSettings = useCallback(() => {
    setErrorMessage("");
    const formData = new FormData();
    formData.append("action", "createSettings");
    formData.append("shop", shop);
    submit(formData, { method: "post" });
  }, [submit, shop]);

  const handleSetupMetafields = useCallback(() => {
    setErrorMessage("");
    const formData = new FormData();
    formData.append("action", "setupMetafields");
    formData.append("shop", shop);
    submit(formData, { method: "post" });
  }, [submit, shop]);

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
                    <strong style={{ color: "green" }}>✓ Registered Automatically</strong>
                  </List.Item>
                  {data.webhookDetails && (
                    <List.Item>
                      Webhook URL: <strong>{data.webhookDetails.address}</strong>
                    </List.Item>
                  )}
                </List>

                <Banner tone="info">
                  Webhooks are registered automatically when you install the app.
                  No manual registration needed!
                </Banner>
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
                  Metafield Configuration
                </Text>
                <Text as="p" variant="bodyMd">
                  The app needs to register a custom metafield definition to store ticket QR codes on orders.
                  Click the button below to set it up.
                </Text>
                <Button
                  onClick={handleSetupMetafields}
                  loading={isLoading}
                  variant="primary"
                >
                  Setup Order Metafields
                </Button>
                <Banner tone="info">
                  This only needs to be done once. If already configured, clicking will confirm it exists.
                </Banner>
              </BlockStack>
            </Card>

            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd" fontWeight="semibold">
                  Instructions
                </Text>
                <List type="number">
                  <List.Item>
                    Click "Setup Order Metafields" above (IMPORTANT!)
                  </List.Item>
                  <List.Item>
                    Webhooks are registered automatically - no action needed!
                  </List.Item>
                  <List.Item>
                    Create default settings if not configured (click button above)
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
                  <List.Item>
                    QR codes will appear on the order confirmation page and be sent via email
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
