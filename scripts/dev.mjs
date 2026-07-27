import { spawn } from "node:child_process";
import dotenv from "dotenv";

const env = { ...process.env };
const nodeEnv = env.NODE_ENV ?? "development";
const envFiles = [
  `.env.${nodeEnv}.local`,
  ...(nodeEnv === "test" ? [] : [".env.local"]),
  `.env.${nodeEnv}`,
  ".env",
];
dotenv.config({ path: envFiles, processEnv: env, quiet: true });

function withoutPortArguments(args) {
  const filtered = [];
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--port" || arg === "-p") {
      index += 1;
      continue;
    }
    if (
      arg.startsWith("--port=") ||
      arg.startsWith("-p=") ||
      /^-p\d+$/.test(arg)
    ) {
      continue;
    }
    filtered.push(arg);
  }
  return filtered;
}

const nextArgs = withoutPortArguments(process.argv.slice(2));

const localUrl = "http://localhost:3000";
env.AUTH_URL = localUrl;
env.NEXT_PUBLIC_APP_URL = localUrl;

const developmentDatabaseName = "ybase-stage";
if (!env.MONGODB_URI) {
  throw new Error("MONGODB_URI is required for local development");
}
env.MONGODB_DB = developmentDatabaseName;
console.info(
  `Using persistent development database "${developmentDatabaseName}".`,
);

const next = spawn(
  "pnpm",
  ["exec", "next", "dev", "--turbopack", "--port", "3000", ...nextArgs],
  {
    env,
    stdio: "inherit",
  },
);

let stopping = false;

function stop(signal) {
  if (stopping) return;
  stopping = true;
  next.kill(signal);
}

process.once("SIGHUP", () => stop("SIGHUP"));
process.once("SIGINT", () => stop("SIGINT"));
process.once("SIGTERM", () => stop("SIGTERM"));

next.once("error", (error) => {
  console.error("Failed to start the Next.js development server.", error);
  process.exitCode = 1;
});

next.once("exit", (code) => {
  process.exit(code ?? 1);
});
