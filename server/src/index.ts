import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import cors from "cors";
import express from "express";
import { connectDb } from "./db.js";
import { seedDatabase } from "./seed.js";
import authRoutes from "./routes/auth.js";
import jobsPublicRoutes from "./routes/jobsPublic.js";
import applicationsPublicRoutes from "./routes/applicationsPublic.js";
import adminRoutes from "./routes/admin.js";
import chatRoutes from "./routes/chat.js";

const serverRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
dotenv.config({ path: path.join(serverRoot, ".env") });

const app = express();
const port = Number(process.env.PORT) || 4000;

app.use(cors({ origin: process.env.CLIENT_ORIGIN ?? "http://localhost:3000" }));
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/api/auth", authRoutes);
app.use("/api/jobs", jobsPublicRoutes);
app.use("/api/applications", applicationsPublicRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/chat", chatRoutes);

async function main() {
  await connectDb();
  await seedDatabase();
  app.listen(port, () => {
    console.log(`API listening on http://localhost:${port}`);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
