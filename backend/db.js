import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI || "mongodb://localhost:27017";
let client = null;
let db = null;

const options = {
  serverSelectionTimeoutMS: 5000,
};

export async function getDb() {
  if (db) return db;
  try {
    if (!client) {
      client = new MongoClient(uri, options);
      await client.connect();
    }
    db = client.db(process.env.MONGODB_DB || "werbens");
    return db;
  } catch (err) {
    client = null;
    db = null;
    throw err;
  }
}
