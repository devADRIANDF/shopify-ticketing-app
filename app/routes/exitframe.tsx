import { LoaderFunctionArgs } from "@remix-run/node";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");

  if (!shop) {
    throw new Response("Missing shop parameter", { status: 400 });
  }

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Redirecting...</title>
      </head>
      <body>
        <script>
          (function() {
            var shop = new URLSearchParams(window.location.search).get("shop");
            var authUrl = "/auth?shop=" + shop;

            if (window.top === window.self) {
              // Not in an iframe
              window.location.href = authUrl;
            } else {
              // In an iframe - break out
              window.top.location.href = authUrl;
            }
          })();
        </script>
        <p>Redirecting...</p>
      </body>
    </html>
  `;

  return new Response(html, {
    headers: {
      "Content-Type": "text/html",
    },
  });
}
