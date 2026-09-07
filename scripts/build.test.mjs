import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, "..");
const outputPath = path.join(rootDir, "out", "schematex-notion.user.js");

test("build produces a single bundled .user.js with the userscript header", () => {
  execFileSync("node", [path.join(rootDir, "scripts", "build.js")], {
    cwd: rootDir,
  });

  assert.ok(fs.existsSync(outputPath), "output file should exist");

  const content = fs.readFileSync(outputPath, "utf8");
  assert.ok(
    content.startsWith("// ==UserScript=="),
    "output should start with the userscript header",
  );
  assert.ok(
    content.includes("==/UserScript=="),
    "output should include the closing userscript header marker",
  );
});
