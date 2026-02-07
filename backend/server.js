import express from "express";
import cors from "cors";
import { saveOnboarding } from "./routes/onboarding.js";

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "werbens-backend" });
});

app.post("/api/onboarding", saveOnboarding);

app.listen(PORT, () => {
  console.log(`Werbens backend running at http://localhost:${PORT}`);
});
