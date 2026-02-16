/**
 * Quick script to verify Agents and Flows in MongoDB.
 * Run from backend: node scripts/check-agents-flows.js
 */
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { getDb } from "../db.js";

function loadEnv() {
  const envPath = join(process.cwd(), ".env");
  if (!existsSync(envPath)) return;
  const content = readFileSync(envPath, "utf8");
  for (const line of content.split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i === -1) continue;
    const key = t.slice(0, i).trim();
    const value = t.slice(i + 1).trim();
    if (key && !process.env[key]) process.env[key] = value;
  }
}

async function main() {
  loadEnv();
  const db = await getDb();
  const dbName = process.env.MONGODB_DB || "werbens";

  const collections = await db.listCollections().toArray();
  console.log("\n=== MongoDB: all collections ===\n");
  console.log("Database:", dbName);
  console.log("Collections:", collections.map((c) => c.name).join(", "));

  for (const c of collections) {
    const coll = db.collection(c.name);
    const count = await coll.countDocuments();
    console.log(`\n--- ${c.name} (${count} docs) ---`);
    if (count > 0) {
      const sample = await coll.find({}).limit(3).toArray();
      sample.forEach((doc, i) => {
        const keys = Object.keys(doc).filter((k) => !k.startsWith("_"));
        console.log(`  [${i + 1}] _id: ${doc._id} | keys: ${keys.join(", ")}`);
        if (doc.name) console.log(`      name: ${doc.name}`);
        if (doc.flow?.blocks) console.log(`      flow.blocks: ${doc.flow.blocks.length}`);
      });
    }
  }
  console.log("\n");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
