import { spawn } from "node:child_process";
import { MongoMemoryServer } from "mongodb-memory-server";

const env = { ...process.env };
let mongo;

if (!env.MONGODB_URI) {
  const dbName = env.MONGODB_DB ?? "ybudget_dev";
  console.info(
    `MONGODB_URI is not set; starting temporary database "${dbName}".`,
  );
  mongo = await MongoMemoryServer.create({ instance: { dbName } });
  env.MONGODB_URI = mongo.getUri();
  env.MONGODB_DB = dbName;
}

const next = spawn(
  "pnpm",
  ["exec", "next", "dev", "--turbopack", ...process.argv.slice(2)],
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
