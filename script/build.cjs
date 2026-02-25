#!/usr/bin/env node
const { execSync } = require("child_process");
const { rmSync } = require("fs");
const path = require("path");

async function buildAll() {
  try {
    // Clean dist
    console.log("🧹 Cleaning dist...");
    rmSync(path.join(process.cwd(), "dist"), { recursive: true, force: true });

    // Build client with vite
    console.log("🔨 Building client...");
    execSync("npx vite build", { stdio: "inherit", cwd: process.cwd() });

    // Build server with esbuild
    console.log("🔨 Building server...");
    const esbuildCmd = `npx esbuild server/index.ts --bundle --format=cjs --outfile=dist/index.cjs --define:process.env.NODE_ENV=\\"production\\" --minify --platform=node --external:@google/genai --external:@neondatabase/serverless --external:bcrypt --external:connect-pg-simple --external:date-fns --external:drizzle-orm --external:drizzle-zod --external:express --external:express-session --external:jsonwebtoken --external:memorystore --external:pg --external:zod --external:zod-validation-error`;
    
    execSync(esbuildCmd, { stdio: "inherit", cwd: process.cwd() });

    console.log("✅ Build complete!");
  } catch (err) {
    console.error("❌ Build failed:", err.message);
    process.exit(1);
  }
}

buildAll();
