/**
 * Inspect data used for automatic generation - run for feedback loop
 * Usage: node scripts/inspect-automatic-data.js [userId]
 */
import "dotenv/config";
import { getDb } from "../db.js";
import { getOnboardingContext } from "../onboarding-context/getOnboardingContext.js";
import { collateRawContext, getRawContextFilePath } from "../context/data-collator/data-collator-raw.js";
import { readFile } from "fs/promises";

const userId = process.argv[2] || "findamirkidwai@gmail.com";

async function main() {
  const db = await getDb();

  console.log("\n=== INSPECT AUTOMATIC DATA ===\n");
  console.log("userId:", userId);

  // 1. Onboarding
  const onboarding = await db.collection("Onboarding").findOne({ userId });
  console.log("\n--- ONBOARDING ---");
  if (onboarding) {
    console.log(JSON.stringify(onboarding, null, 2));
  } else {
    console.log("No onboarding data.");
  }

  // 2. general_onboarding_context
  console.log("\n--- GENERAL_ONBOARDING_CONTEXT (used for automatic) ---");
  if (onboarding?.general_onboarding_context) {
    console.log(onboarding.general_onboarding_context);
  } else {
    const formatted = await getOnboardingContext(userId);
    console.log(formatted);
  }

  // 3. SocialMedia per platform
  const socialDocs = await db.collection("SocialMedia").find({ userId }).toArray();
  console.log("\n--- SOCIAL MEDIA (platforms with data) ---");
  socialDocs.forEach((d) => {
    const hasPosts = (d.posts?.length ?? 0) > 0;
    const hasMedia = (d.media?.length ?? 0) > 0;
    const hasProfile = !!d.profile;
    console.log(`  ${d.platform}: profile=${hasProfile}, posts=${d.posts?.length ?? 0}, media=${d.media?.length ?? 0}`);
  });

  // 4. Raw context
  try {
    await collateRawContext(userId);
    const rawPath = getRawContextFilePath();
    const rawText = await readFile(rawPath, "utf-8");
    console.log("\n--- RAW CONTEXT (platform data) ---");
    console.log(rawText.substring(0, 2000) + (rawText.length > 2000 ? "\n... [truncated]" : ""));
  } catch (err) {
    console.log("\n--- RAW CONTEXT ---");
    console.error("Error:", err.message);
  }

  // 5. Context (Gemini-summarized)
  const context = await db.collection("Context").findOne({ userId });
  console.log("\n--- CONTEXT (Gemini summarized) ---");
  if (context) {
    console.log(JSON.stringify(context, null, 2));
  } else {
    console.log("No context. Run context update first.");
  }

  // 6. Automatic items
  const automatic = await db.collection("Automatic").findOne({ userId });
  console.log("\n--- AUTOMATIC ITEMS ---");
  if (automatic?.items?.length) {
    console.log(`Count: ${automatic.items.length}`);
    automatic.items.slice(0, 2).forEach((item, i) => {
      console.log(`\n[${i + 1}] prompt (first 300 chars):`, (item.prompt || "").substring(0, 300));
    });
  } else {
    console.log("No automatic items.");
  }

  console.log("\n=== DONE ===\n");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
