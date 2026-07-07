#!/usr/bin/env node

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { spawn } from "node:child_process";
import { createInterface } from "node:readline";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const examplePath = join(root, ".env.example");
const localPath = join(root, ".env.local");

const requiredMajor = 20;
const nodeMajor = Number.parseInt(process.versions.node.split(".")[0] ?? "0", 10);
const isInteractive = process.stdin.isTTY && process.stdout.isTTY && !process.argv.includes("--yes") && !process.argv.includes("--no-interactive");

const GROUPS = [
  {
    id: "github",
    title: "GitHub cards",
    question: "Set up GitHub profile cards now?",
    keys: [
      {
        key: "GITHUB_TOKEN",
        label: "GitHub token",
        secret: true,
        help: "Read-only token. Required for live GitHub profile cards.",
      },
      {
        key: "GITHUB_TOKENS",
        label: "GitHub token pool",
        secret: true,
        help: "Optional comma-separated tokens for higher traffic. Leave blank to reuse GITHUB_TOKEN.",
      },
    ],
  },
  {
    id: "youtube",
    title: "YouTube cards",
    question: "Set up YouTube channel cards now?",
    keys: [
      {
        key: "YOUTUBE_API_KEY",
        label: "YouTube Data API v3 key",
        secret: true,
        help: "Required for live YouTube channel cards.",
      },
    ],
  },
  {
    id: "supabase",
    title: "Supabase community",
    question: "Set up Supabase community/auth reads now?",
    keys: [
      {
        key: "NEXT_PUBLIC_SUPABASE_URL",
        label: "Supabase URL",
        help: "Optional. Enables Supabase-backed community data.",
      },
      {
        key: "NEXT_PUBLIC_SUPABASE_ANON_KEY",
        label: "Supabase anon key",
        secret: true,
        help: "Optional public anon key for Supabase reads/auth.",
      },
      {
        key: "SUPABASE_SERVICE_ROLE_KEY",
        label: "Supabase service role key",
        secret: true,
        help: "Optional server-only key for writes. Leave blank for read-only/self-host demos.",
      },
    ],
  },
  {
    id: "redis",
    title: "Redis cache",
    question: "Set up Redis cache now?",
    keys: [
      {
        key: "UPSTASH_REDIS_REST_URL",
        label: "Redis URL",
        help: "Optional. Supports REDIS_URL or Upstash-style URLs depending on deployment.",
      },
      {
        key: "UPSTASH_REDIS_REST_TOKEN",
        label: "Redis token",
        secret: true,
        help: "Optional. Leave blank if your Redis URL already contains credentials.",
      },
    ],
  },
];

function log(message = "") {
  process.stdout.write(`${message}\n`);
}

function warn(message) {
  process.stderr.write(`Warning: ${message}\n`);
}

function envEntries(source) {
  return source
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#") && line.includes("="))
    .map((line) => {
      const index = line.indexOf("=");
      return [line.slice(0, index), line.slice(index + 1)];
    });
}

function envKeys(source) {
  return envEntries(source).map(([key]) => key);
}

function parseEnv(source) {
  return new Map(envEntries(source));
}

function setEnvValue(source, key, value) {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const line = `${key}=${value}`;
  const pattern = new RegExp(`^${escaped}=.*$`, "m");
  if (pattern.test(source)) return source.replace(pattern, line);
  return `${source.trimEnd()}\n${line}\n`;
}

function missingValues(source) {
  return envEntries(source)
    .filter(([key, value]) => key !== "NEXT_PUBLIC_SITE_URL" && value === "")
    .map(([key]) => key);
}

function yes(value) {
  return ["y", "yes", "s", "si", "sí"].includes(value.trim().toLowerCase());
}

function createPrompt() {
  return createInterface({ input: process.stdin, output: process.stdout });
}

async function ask(rl, question, defaultValue = "") {
  const suffix = defaultValue ? ` (${defaultValue})` : "";
  if (rl.closed) return "";
  const answer = await new Promise((resolve) => {
    let settled = false;
    const finish = (value) => {
      if (settled) return;
      settled = true;
      rl.off("close", onClose);
      resolve(value);
    };
    const onClose = () => finish("");
    rl.once("close", onClose);
    rl.question(`${question}${suffix}: `, finish);
  });
  return answer.trim();
}

async function askSecret(rl, question) {
  return ask(rl, question);
}

async function runDevServer() {
  const command = process.platform === "win32" ? "npm.cmd" : "npm";
  const child = spawn(command, ["run", "dev"], { cwd: root, stdio: "inherit" });
  return new Promise((resolve) => child.on("close", resolve));
}

function printSummary(source) {
  const values = parseEnv(source);
  const enabled = [];
  if (values.get("GITHUB_TOKEN") || values.get("GITHUB_TOKENS")) enabled.push("GitHub cards");
  if (values.get("YOUTUBE_API_KEY")) enabled.push("YouTube cards");
  if (values.get("NEXT_PUBLIC_SUPABASE_URL") && values.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")) enabled.push("Supabase community/auth");
  if (values.get("UPSTASH_REDIS_REST_URL") || values.get("REDIS_URL")) enabled.push("Redis cache");

  log("");
  log("Configured:");
  if (enabled.length) {
    for (const item of enabled) log(`- ${item}`);
  } else {
    log("- No external integrations yet. The app still runs with sample/fallback data.");
  }
}

if (nodeMajor < requiredMajor) {
  warn(`Node ${requiredMajor}+ is recommended. Current version: ${process.versions.node}`);
}

if (!existsSync(examplePath)) {
  process.stderr.write("Missing .env.example. Cannot create .env.local.\n");
  process.exit(1);
}

const example = readFileSync(examplePath, "utf8");
let envSource = "";

if (!existsSync(localPath)) {
  writeFileSync(localPath, example, { mode: 0o600 });
  envSource = example;
  log("Created .env.local from .env.example.");
} else {
  log(".env.local already exists. Left it untouched.");
  envSource = readFileSync(localPath, "utf8");

  const localKeys = new Set(envKeys(envSource));
  const missingKeys = envKeys(example).filter((key) => !localKeys.has(key));
  if (missingKeys.length) {
    log("");
    log("Added missing keys from .env.example:");
    for (const key of missingKeys) {
      envSource = setEnvValue(envSource, key, "");
      log(`- ${key}`);
    }
    writeFileSync(localPath, envSource, { mode: 0o600 });
  }
}

if (isInteractive) {
  log("");
  log("FutClaw setup");
  log("Press Enter to skip any optional value. Values are written only to .env.local.");

  const rl = createPrompt();

  for (const group of GROUPS) {
    log("");
    log(group.title);
    const shouldConfigure = yes(await ask(rl, group.question, "y/N"));
    if (!shouldConfigure) continue;

    for (const item of group.keys) {
      const current = parseEnv(envSource).get(item.key) ?? "";
      const alreadySet = current ? " already set" : "";
      log(`- ${item.help}`);
      const prompt = `${item.label}${alreadySet}`;
      const value = item.secret ? await askSecret(rl, prompt) : await ask(rl, prompt);
      if (value) {
        envSource = setEnvValue(envSource, item.key, value);
        if (item.key === "GITHUB_TOKEN" && !(parseEnv(envSource).get("GITHUB_TOKENS") ?? "")) {
          envSource = setEnvValue(envSource, "GITHUB_TOKENS", value);
        }
      }
    }
  }

  envSource = setEnvValue(envSource, "NEXT_PUBLIC_SITE_URL", parseEnv(envSource).get("NEXT_PUBLIC_SITE_URL") || "http://localhost:3000");
  writeFileSync(localPath, envSource, { mode: 0o600 });
  rl.close();
} else {
  log("");
  log("Non-interactive setup complete.");
  log("Run `npm run setup` in a terminal to enter API keys interactively, or edit .env.local manually.");
}

envSource = readFileSync(localPath, "utf8");
printSummary(envSource);

const emptyKeys = missingValues(envSource);

log("");
log("Next steps:");
if (emptyKeys.length) {
  log("- Optional env vars still blank:");
  for (const key of emptyKeys) log(`  - ${key}`);
}
log("- Run `npm install` if dependencies are not installed.");
log("- Run `npm run dev` to start FutClaw locally.");

log("");
log("Security:");
log("- .env.local is ignored by git.");
log("- Keep service role keys, GitHub tokens, YouTube API keys, Redis tokens, and analytics secrets out of commits.");

if (isInteractive) {
  const rl = createPrompt();
  const startNow = yes(await ask(rl, "Start the dev server now?", "y/N"));
  rl.close();
  if (startNow) {
    log("");
    log("Starting http://localhost:3000 ...");
    await runDevServer();
  }
}
