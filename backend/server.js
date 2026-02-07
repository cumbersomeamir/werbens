import express from "express";

const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "werbens-backend" });
});

app.listen(PORT, () => {
  console.log(`Werbens backend running at http://localhost:${PORT}`);
});
