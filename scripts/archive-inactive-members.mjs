import dotenv from "dotenv";
import { MongoClient } from "mongodb";

dotenv.config({ quiet: true });

const apply = process.argv.includes("--apply");
const expectedCountArgument = process.argv.find((argument) =>
  argument.startsWith("--expected-count="),
);
const expectedCount = expectedCountArgument
  ? Number(expectedCountArgument.split("=")[1])
  : undefined;
const uri = process.env.MONGODB_URI;
const databaseName = process.env.MONGODB_DB ?? "ybase";

if (!uri) throw new Error("MONGODB_URI is required");
if (
  expectedCount !== undefined &&
  (!Number.isSafeInteger(expectedCount) || expectedCount < 0)
) {
  throw new Error("--expected-count must be a non-negative integer");
}

const client = new MongoClient(uri);
await client.connect();

try {
  const members = client.db(databaseName).collection("users");
  const filter = { memberStatus: "inactive" };
  const currentCount = await members.countDocuments(filter);

  console.info(
    `${apply ? "Apply" : "Dry run"}: ${currentCount} inactive member(s) in "${databaseName}".`,
  );

  if (!apply) {
    console.info(
      `Re-run with --apply --expected-count=${currentCount} after verifying a current backup.`,
    );
  } else {
    if (expectedCount === undefined) {
      throw new Error("--expected-count is required with --apply");
    }
    if (currentCount !== expectedCount) {
      throw new Error(
        `Expected ${expectedCount} inactive members, found ${currentCount}.`,
      );
    }

    const now = Date.now();
    const result = await members.updateMany(filter, [
      {
        $set: {
          memberStatus: "archived",
          archivedAt: { $ifNull: ["$archivedAt", now] },
        },
      },
    ]);
    const remainingCount = await members.countDocuments(filter);
    const archivedCount = await members.countDocuments({
      memberStatus: "archived",
    });

    console.info(
      `Matched ${result.matchedCount}, modified ${result.modifiedCount}, remaining inactive ${remainingCount}, archived total ${archivedCount}.`,
    );
    if (remainingCount !== 0 || result.matchedCount !== expectedCount) {
      throw new Error("Migration verification failed");
    }
  }
} finally {
  await client.close();
}
