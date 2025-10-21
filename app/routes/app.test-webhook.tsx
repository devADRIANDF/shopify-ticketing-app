import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  BlockStack,
  Text,
  Banner,
  List,
} from "@shopify/polaris";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop") || "";

  return json({ shop });
};

export default function TestWebhookPage() {
  const { shop } = useLoaderData<typeof loader>();

  return (
    <Page
      title="Test Webhook"
      subtitle="Verificar si el webhook está funcionando"
      backAction={{ content: "Dashboard", url: `/app?shop=${shop}` }}
    >
      <Layout>
        <Layout.Section>
          <BlockStack gap="500">
            <Banner tone="info">
              <BlockStack gap="200">
                <Text as="p" variant="bodyMd">
                  Para verificar si el webhook está funcionando correctamente, necesitas:
                </Text>
              </BlockStack>
            </Banner>

            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd" fontWeight="semibold">
                  Pasos para probar
                </Text>
                <List type="number">
                  <List.Item>
                    Ve a Productos y asegúrate que tu producto tenga el tag <strong>"ticket"</strong>
                  </List.Item>
                  <List.Item>
                    Crea un pedido de prueba con ese producto
                  </List.Item>
                  <List.Item>
                    Ve a la página de "Tickets" en la app
                  </List.Item>
                  <List.Item>
                    Si ves tickets generados, el webhook funciona ✅
                  </List.Item>
                  <List.Item>
                    Si NO ves tickets, el webhook no se está ejecutando ❌
                  </List.Item>
                </List>
              </BlockStack>
            </Card>

            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd" fontWeight="semibold">
                  Información importante
                </Text>
                <List>
                  <List.Item>
                    <strong>URL del webhook:</strong> https://shopify-ticketing-app.onrender.com/api/webhooks/orders/create
                  </List.Item>
                  <List.Item>
                    <strong>Evento:</strong> orders/create
                  </List.Item>
                  <List.Item>
                    <strong>Tag requerido:</strong> "ticket" (en minúsculas)
                  </List.Item>
                </List>
              </BlockStack>
            </Card>

            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd" fontWeight="semibold">
                  Si el webhook NO funciona
                </Text>
                <Text as="p" variant="bodyMd">
                  Posibles razones:
                </Text>
                <List>
                  <List.Item>El servidor de Render está dormido (plan gratuito)</List.Item>
                  <List.Item>El webhook no está registrado correctamente en Shopify</List.Item>
                  <List.Item>El producto no tiene el tag "ticket"</List.Item>
                </List>
              </BlockStack>
            </Card>
          </BlockStack>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
