import { MongoMemoryServer } from "mongodb-memory-server";

export default async function prepareMongoBinary() {
  const mongo = await MongoMemoryServer.create();
  await mongo.stop();
}
