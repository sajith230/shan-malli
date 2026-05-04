import "dotenv/config";
import cors from "cors";
import express from "express";
import { connectDb } from "./db.js";
import { Example } from "./models/Example.js";

const app = express();
const port = Number(process.env.PORT) || 4000;

app.use(cors({ origin: process.env.CLIENT_ORIGIN ?? "http://localhost:3000" }));
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/api/examples", async (_req, res) => {
  const items = await Example.find().sort({ createdAt: -1 }).limit(50).lean();
  res.json(items);
});

app.post("/api/examples", async (req, res) => {
  const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
  if (!name) {
    res.status(400).json({ error: "name is required" });
    return;
  }
  const doc = await Example.create({ name });
  res.status(201).json(doc);
});

async function main() {
  await connectDb();
  app.listen(port, () => {
    console.log(`API listening on http://localhost:${port}`);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
