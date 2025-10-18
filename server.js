import { createRequestHandler } from "@remix-run/node";
import { installGlobals } from "@remix-run/node";
import express from "express";

installGlobals();

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from public/build
app.use("/build", express.static("public/build", { immutable: true, maxAge: "1y" }));

// Serve other static assets
app.use(express.static("public", { maxAge: "1h" }));

// Handle Remix requests
app.all("*", async (req, res, next) => {
  try {
    const build = await import("./build/index.js");

    const handler = createRequestHandler({
      build,
      mode: process.env.NODE_ENV || "production",
    });

    // Convert Express request to Fetch API Request
    const url = new URL(req.url, `https://${req.get("host")}`);

    const request = new Request(url.toString(), {
      method: req.method,
      headers: new Headers(Object.entries(req.headers)),
      body:
        req.method !== "GET" && req.method !== "HEAD"
          ? JSON.stringify(req.body)
          : undefined,
    });

    const response = await handler(request);

    // Convert Fetch API Response to Express response
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
    console.error("Error handling request:", error);
    next(error);
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
