import { spawn } from "node:child_process";
import dotenv from "dotenv";
import { MongoMemoryServer } from "mongodb-memory-server";

const env = { ...process.env };
const hasExplicitMongoUri = Boolean(env.MONGODB_URI);
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
let mongo;

const localUrl = "http://localhost:3000";
if (!env.AUTH_URL && !env.NEXTAUTH_URL) env.AUTH_URL = localUrl;
if (!env.NEXT_PUBLIC_APP_URL) env.NEXT_PUBLIC_APP_URL = localUrl;

const shouldStartTemporaryDatabase =
  !env.MONGODB_URI || (env.IS_TEST === "true" && !hasExplicitMongoUri);

if (shouldStartTemporaryDatabase) {
  const dbName = env.MONGODB_DB ?? "ybase_dev";
  console.info(`Starting temporary database "${dbName}".`);
  mongo = await MongoMemoryServer.create({ instance: { dbName } });
  env.MONGODB_URI = mongo.getUri();
  env.MONGODB_DB = dbName;
}

const next = spawn(
  "pnpm",
  ["exec", "next", "dev", "--turbopack", "--port", "3000", ...nextArgs],
  {
    env,
    stdio: "inherit",
  },
);

let stopping = false;

async function stopMongo() {
  if (!mongo) return;
  const instance = mongo;
  mongo = undefined;
  await instance.stop();
}

async function stop(signal) {
  if (stopping) return;
  stopping = true;
  next.kill(signal);
  await stopMongo();
}

process.once("SIGHUP", () => void stop("SIGHUP"));
process.once("SIGINT", () => void stop("SIGINT"));
process.once("SIGTERM", () => void stop("SIGTERM"));

next.once("error", async (error) => {
  console.error("Failed to start the Next.js development server.", error);
  await stopMongo();
  process.exitCode = 1;
});

next.once("exit", async (code) => {
  await stopMongo();
  process.exit(code ?? 1);
});
