#!/usr/bin/env node

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const examplePath = join(root, ".env.example");
const localPath = join(root, ".env.local");

const requiredMajor = 20;
const nodeMajor = Number.parseInt(process.versions.node.split(".")[0] ?? "0", 10);

function log(message = "") {
  process.stdout.write(`${message}\n`);
}

function warn(message) {
  process.stderr.write(`Warning: ${message}\n`);
}

function envKeys(source) {
  return source
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#") && line.includes("="))
    .map((line) => line.slice(0, line.indexOf("=")));
}

function missingValues(source) {
  return source
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#") && line.includes("="))
    .map((line) => {
      const index = line.indexOf("=");
      return [line.slice(0, index), line.slice(index + 1)];
    })
    .filter(([key, value]) => key !== "NEXT_PUBLIC_SITE_URL" && value === "")
    .map(([key]) => key);
}

if (nodeMajor < requiredMajor) {
  warn(`Node ${requiredMajor}+ is recommended. Current version: ${process.versions.node}`);
}

if (!existsSync(examplePath)) {
  process.stderr.write("Missing .env.example. Cannot create .env.local.\n");
  process.exit(1);
}

const example = readFileSync(examplePath, "utf8");

if (!existsSync(localPath)) {
  writeFileSync(localPath, example, { mode: 0o600 });
  log("Created .env.local from .env.example.");
} else {
  log(".env.local already exists. Left it untouched.");

  const local = readFileSync(localPath, "utf8");
  const localKeys = new Set(envKeys(local));
  const missingKeys = envKeys(example).filter((key) => !localKeys.has(key));
  if (missingKeys.length) {
    log("");
    log("Keys present in .env.example but missing from .env.local:");
    for (const key of missingKeys) log(`- ${key}`);
  }
}

const localSource = existsSync(localPath) ? readFileSync(localPath, "utf8") : example;
const emptyKeys = missingValues(localSource);

log("");
log("Next steps:");
if (emptyKeys.length) {
  log("1. Fill these local-only env vars in .env.local:");
  for (const key of emptyKeys) log(`   - ${key}`);
  log("2. Run npm install if dependencies are not installed.");
  log("3. Run npm run dev.");
} else {
  log("1. Run npm install if dependencies are not installed.");
  log("2. Run npm run dev.");
}

log("");
log("Security:");
log("- .env.local is ignored by git.");
log("- Keep service role keys, GitHub tokens, Redis tokens, and analytics secrets out of commits.");
