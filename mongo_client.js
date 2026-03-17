import { MongoClient } from "mongodb";

let clientPromise;

function getMongoUri() {
  return process.env.MONGO_URI || "";
}

function getDatabaseNameFromUri(uri) {
  try {
    const url = new URL(uri);
    const pathname = url.pathname.replace(/^\//, "");
    return pathname || "db_nava";
  } catch (error) {
    return "db_nava";
  }
}

export async function getMongoDb() {
  const uri = getMongoUri();
  if (!uri) return null;

  if (!clientPromise) {
    const client = new MongoClient(uri);
    clientPromise = client.connect();
  }

  const client = await clientPromise;
  const dbName = process.env.MONGO_DB_NAME || getDatabaseNameFromUri(uri);
  return client.db(dbName);
}
