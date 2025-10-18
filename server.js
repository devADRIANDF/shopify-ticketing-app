import { createRequestHandler } from "@remix-run/express";
import express from "express";

const app = express();
const PORT = process.env.PORT || 3000;

// Disable x-powered-by header
app.disable("x-powered-by");

// Serve static files from public/build
app.use(
  "/build",
  express.static("public/build", {
    immutable: true,
    maxAge: "1y",
  })
);

// Serve other static assets
app.use(express.static("public", { maxAge: "1h" }));

// Load the build on startup
const build = await import("./build/index.js");

// Handle all Remix requests
app.all(
  "*",
  createRequestHandler({
    build,
    mode: process.env.NODE_ENV || "production",
  })
);

app.listen(PORT, () => {
  console.log(`Express server listening on port ${PORT}`);
});
