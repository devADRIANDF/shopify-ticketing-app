import "@shopify/shopify-app-remix/adapters/node";
import {
  ApiVersion,
  AppDistribution,
  shopifyApp,
  DeliveryMethod,
} from "@shopify/shopify-app-remix/server";
import { PrismaSessionStorage } from "@shopify/shopify-app-session-storage-prisma";
import { prisma } from "./lib/db.server";
import { restResources } from "@shopify/shopify-api/rest/admin/2024-01";

const prismaSessionStorage = new PrismaSessionStorage(prisma);

const shopify = shopifyApp({
  apiKey: process.env.SHOPIFY_API_KEY!,
  apiSecretKey: process.env.SHOPIFY_API_SECRET || "",
  apiVersion: ApiVersion.January24,
  scopes: process.env.SCOPES?.split(",") || [],
  appUrl: (process.env.SHOPIFY_APP_URL || "") + "/app",
  authPathPrefix: "/auth",
  sessionStorage: prismaSessionStorage,
  distribution: AppDistribution.AppStore,
  restResources,
  isEmbeddedApp: true,
  webhooks: {
    ORDERS_CREATE: {
      deliveryMethod: DeliveryMethod.Http,
      callbackUrl: "/api/webhooks/orders/create",
    },
  },
  hooks: {
    afterAuth: async ({ session }) => {
      shopify.registerWebhooks({ session });

      // Create default app settings if they don't exist
      const existingSettings = await prisma.appSettings.findUnique({
        where: { shop: session.shop },
      });

      if (!existingSettings) {
        await prisma.appSettings.create({
          data: {
            shop: session.shop,
            ticketTag: "ticket",
            autoEmailEnabled: true,
            brandColor: "#5C6AC4",
          },
        });
      }
    },
  },
  future: {
    v3_webhookAdminContext: true,
    v3_authenticatePublic: true,
  },
  useOnlineTokens: true,
  ...(process.env.SHOP_CUSTOM_DOMAIN
    ? { customShopDomains: [process.env.SHOP_CUSTOM_DOMAIN] }
    : {}),
});

export default shopify;
export const apiVersion = ApiVersion.January24;
export const addDocumentResponseHeaders = shopify.addDocumentResponseHeaders;
export const authenticate = shopify.authenticate;
export const unauthenticated = shopify.unauthenticated;
export const login = shopify.login;
export const registerWebhooks = shopify.registerWebhooks;
export const sessionStorage = prismaSessionStorage;
