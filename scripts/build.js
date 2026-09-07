#!/usr/bin/env node

import esbuild from "esbuild";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, "..");

async function build() {
  const isDev = process.argv.includes("--dev");
  const entryPath = path.join(rootDir, "src", "schematex-notion.user.ts");
  const outDir = path.join(rootDir, "out");
  const outputPath = path.join(outDir, "schematex-notion.user.js");

  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const originalContent = fs.readFileSync(entryPath, "utf8");
  const headerMatch = originalContent.match(
    /(\/\/ ==UserScript==[\s\S]*?\/\/ ==\/UserScript==)/,
  );
  const userscriptHeader = headerMatch ? headerMatch[1] : "";

  const result = await esbuild.build({
    entryPoints: [entryPath],
    bundle: true,
    format: "iife",
    outfile: outputPath,
    platform: "browser",
    target: "es2020",
    minify: !isDev,
    sourcemap: isDev,
    write: false,
    banner: {
      js: `${userscriptHeader}\n`,
    },
  });

  let bundledContent = result.outputFiles[0].text;
  // In dev builds (unminified), the source file's own header comment
  // survives esbuild's output alongside the banner's copy, duplicating it.
  // In production builds, esbuild's minifier already strips the plain
  // source-embedded comment, leaving only the banner's copy — so only
  // remove a second occurrence when one actually exists; blindly replacing
  // the first occurrence would delete the *only* copy in production builds.
  const firstIndex = userscriptHeader ? bundledContent.indexOf(userscriptHeader) : -1;
  const lastIndex = userscriptHeader ? bundledContent.lastIndexOf(userscriptHeader) : -1;
  if (firstIndex !== -1 && firstIndex !== lastIndex) {
    bundledContent =
      bundledContent.slice(0, lastIndex) +
      bundledContent.slice(lastIndex + userscriptHeader.length);
  }
  fs.writeFileSync(outputPath, bundledContent);

  const stats = fs.statSync(outputPath);
  console.log(`Built ${outputPath} (${(stats.size / 1024).toFixed(2)} KB)`);
}

build().catch((error) => {
  console.error("Build failed:", error);
  process.exit(1);
});
