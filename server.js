import { createRequestHandler } from "@remix-run/express";
import express from "express";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { existsSync, readFileSync } from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
  next();
});

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Check build file exists
const buildPath = join(__dirname, "build", "index.js");
console.log("=== Server Startup Debug ===");
console.log("__dirname:", __dirname);
console.log("buildPath:", buildPath);
console.log("Build file exists:", existsSync(buildPath));

if (!existsSync(buildPath)) {
  console.error("ERROR: Build file not found at", buildPath);
  console.error("Please check your build process");
  process.exit(1);
}

// Read and show first 500 chars of build file
try {
  const buildContent = readFileSync(buildPath, "utf-8");
  console.log("=== First 500 characters of build/index.js ===");
  console.log(buildContent.substring(0, 500));
  console.log("=== End of preview ===");
} catch (error) {
  console.error("ERROR reading build file:", error);
}

// Load Remix build
let build;
try {
  console.log("Attempting to import build from:", buildPath);
  build = await import(buildPath);
  console.log("Build imported successfully!");
  console.log("Build exports:", Object.keys(build));
} catch (error) {
  console.error("ERROR importing build:", error);
  console.error("Stack trace:", error.stack);
  process.exit(1);
}

// Create Remix request handler
const remixHandler = createRequestHandler({
  build,
  mode: process.env.NODE_ENV || "production",
});

// Serve all requests with Remix
app.all("*", remixHandler);

// Start server
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
});
