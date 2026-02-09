/**
 * Onboarding controller - handles onboarding API requests
 */
import { saveOnboardingData } from "../services/onboardingService.js";

export async function saveOnboarding(req, res) {
  try {
    const { userId, username, platforms, business, goals } = req.body;

    const result = await saveOnboardingData({
      userId,
      username,
      platforms,
      business,
      goals,
    });

    res.status(201).json(result);
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
    if (err.message === "At least one platform is required") {
      return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: "Failed to save onboarding" });
  }
}
