import { createRequestHandler } from "@remix-run/node";
import { installGlobals } from "@remix-run/node";

installGlobals();

export default async function handler(req, res) {
  try {
    // Dynamic import of the build
    const build = await import("../build/index.js");

    // Create the Remix request handler
    const handleRequest = createRequestHandler({
      build,
      mode: process.env.NODE_ENV || "production",
    });

    // Convert Vercel request to Fetch API Request
    const url = new URL(req.url || "/", `https://${req.headers.host}`);
    const request = new Request(url.toString(), {
      method: req.method,
      headers: new Headers(req.headers),
      body:
        req.method !== "GET" && req.method !== "HEAD"
          ? JSON.stringify(req.body)
          : undefined,
    });

    // Handle the request with Remix
    const response = await handleRequest(request);

    // Convert Fetch API Response to Vercel response
    res.status(response.status);

    response.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });

    if (response.body) {
      const reader = response.body.getReader();
      const chunks = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
      }

      const body = Buffer.concat(chunks);
      res.send(body);
    } else {
      res.end();
    }
  } catch (error) {
    console.error("Error in Vercel handler:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined
    });
  }
}
