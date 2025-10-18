import { RemixBrowser } from "@remix-run/react";
import { startTransition, StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";

startTransition(() => {
  hydrateRoot(
    document,
    <StrictMode>
      <RemixBrowser />
    </StrictMode>
  );
});

// Initialize Shopify App Bridge
if (window.shopify) {
  window.shopify.idToken().then(() => {
    console.log("App Bridge initialized");
  });
}
