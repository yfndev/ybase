import { type Db, MongoClient } from "mongodb";

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

function clientPromise(): Promise<MongoClient> {
  if (!globalThis._mongoClientPromise) {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error("MONGODB_URI is not set");
    globalThis._mongoClientPromise = new MongoClient(uri).connect();
  }
  return globalThis._mongoClientPromise;
}

export function getClient(): Promise<MongoClient> {
  return clientPromise();
}

export async function getDb(): Promise<Db> {
  const client = await clientPromise();
  return client.db(process.env.MONGODB_DB ?? "ybase");
}
