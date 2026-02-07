import { getDb } from "../db.js";

export async function saveOnboarding(req, res) {
  try {
    const { userId, username, platforms, business, goals } = req.body;

    if (!platforms || !Array.isArray(platforms) || platforms.length === 0) {
      return res.status(400).json({
        error: "At least one platform is required",
      });
    }

    const db = await getDb();
    const collection = db.collection("Onboarding");

    const doc = {
      userId: userId || null,
      username: username || null,
      platforms,
      business: business || null,
      goals: goals || [],
      completedAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await collection.insertOne(doc);

    res.status(201).json({
      success: true,
      id: result.insertedId,
    });
  } catch (err) {
    const isMongoDown =
      err.name === "MongoServerSelectionError" ||
      err.name === "MongoNetworkError" ||
      err.cause?.code === "ECONNREFUSED";
    console.error("Onboarding save error:", err.message);
    if (isMongoDown) {
      return res.status(503).json({
        error: "Database unavailable. Start MongoDB or add MONGODB_URI to .env",
        skipped: true,
      });
    }
    res.status(500).json({ error: "Failed to save onboarding" });
  }
}
