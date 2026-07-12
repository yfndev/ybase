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

const nextArgs = process.argv.slice(2);
let mongo;

if (
  env.CONDUCTOR_PORT &&
  !nextArgs.some(
    (arg) => arg === "--port" || arg === "-p" || arg.startsWith("--port="),
  )
) {
  nextArgs.push("--port", env.CONDUCTOR_PORT);
}

const shouldStartTemporaryDatabase =
  !env.MONGODB_URI || (env.IS_TEST === "true" && !hasExplicitMongoUri);

if (shouldStartTemporaryDatabase) {
  const dbName = env.MONGODB_DB ?? "ybudget_dev";
  console.info(`Starting temporary database "${dbName}".`);
  mongo = await MongoMemoryServer.create({ instance: { dbName } });
  env.MONGODB_URI = mongo.getUri();
  env.MONGODB_DB = dbName;
}

const next = spawn(
  "pnpm",
  ["exec", "next", "dev", "--turbopack", ...nextArgs],
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
