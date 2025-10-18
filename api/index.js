import { createRequestHandler } from "@remix-run/express";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Serve static files from local api directory (copied during build)
app.use("/build", express.static(path.join(__dirname, "public/build"), {
  immutable: true,
  maxAge: "1y"
}));

app.use(express.static(path.join(__dirname, "public"), { maxAge: "1h" }));

// Remix handler
app.all("*", async (req, res, next) => {
  try {
    // Import from local build directory (copied during build)
    const build = await import("./build/index.js");

    const handler = createRequestHandler({
      build,
      mode: process.env.NODE_ENV || "production",
    });

    return handler(req, res, next);
  } catch (error) {
    console.error("Error loading Remix build:", error);
    console.error("__dirname:", __dirname);
    next(error);
  }
});

export default app;
