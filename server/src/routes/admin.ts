import mongoose from "mongoose";
import { Router } from "express";
import type { AdminRequest } from "../middleware/requireAdmin.js";
import { requireAdmin } from "../middleware/requireAdmin.js";
import { User } from "../models/User.js";
import { Job } from "../models/Job.js";
import { Application } from "../models/Application.js";
import { hashPassword } from "../lib/password.js";
import { toPublicUser } from "../lib/serializeUser.js";

const router = Router();
router.use(requireAdmin);

router.get("/dashboard", async (_req, res) => {
  const [userRoleAgg, jobStatusAgg, appWeek] = await Promise.all([
    User.aggregate([{ $group: { _id: "$role", count: { $sum: 1 } } }]),
    Job.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    (async () => {
      const start = new Date();
      start.setDate(start.getDate() - 6);
      start.setHours(0, 0, 0, 0);
      const rows = await Application.aggregate([
        { $match: { createdAt: { $gte: start } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]);
      const map = new Map(rows.map((r) => [r._id, r.count as number]));
      const days: { date: string; count: number }[] = [];
      for (let i = 0; i < 7; i += 1) {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        const key = d.toISOString().slice(0, 10);
        days.push({ date: key, count: map.get(key) ?? 0 });
      }
      return days;
    })(),
  ]);

  const usersByRole: Record<string, number> = {};
  for (const row of userRoleAgg) {
    usersByRole[String(row._id)] = row.count as number;
  }
  const jobsByStatus: Record<string, number> = {};
  for (const row of jobStatusAgg) {
    jobsByStatus[String(row._id)] = row.count as number;
  }

  const [userCount, jobCount, applicationCount, pendingApplications] = await Promise.all([
    User.countDocuments(),
    Job.countDocuments(),
    Application.countDocuments(),
    Application.countDocuments({ status: "pending" }),
  ]);

  res.json({
    totals: { users: userCount, jobs: jobCount, applications: applicationCount, pendingApplications },
    usersByRole,
    jobsByStatus,
    applicationsLast7Days: appWeek,
  });
});

router.get("/users", async (_req, res) => {
  const users = await User.find().sort({ createdAt: -1 }).lean();
  res.json(users.map((u) => toPublicUser(u)));
});

router.post("/users", async (req, res) => {
  const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
  const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
  const password = typeof req.body?.password === "string" ? req.body.password : "";
  const role = req.body?.role === "admin" || req.body?.role === "user" ? req.body.role : "user";
  if (!name || !email || !password) {
    res.status(400).json({ error: "Name, email, and password are required" });
    return;
  }
  const exists = await User.findOne({ email });
  if (exists) {
    res.status(409).json({ error: "User already exists with this email" });
    return;
  }
  const hashed = await hashPassword(password);
  const user = await User.create({ name, email, password: hashed, role });
  res.status(201).json({ user: toPublicUser(user) });
});

router.patch("/users/:id", async (req: AdminRequest, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    res.status(400).json({ error: "Invalid user id" });
    return;
  }
  const target = await User.findById(id);
  if (!target) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const adminCount = await User.countDocuments({ role: "admin" });
  if (target.role === "admin" && req.body?.role === "user" && adminCount <= 1) {
    res.status(400).json({ error: "Cannot demote the last admin" });
    return;
  }

  if (typeof req.body?.name === "string") {
    target.name = req.body.name.trim();
  }
  if (typeof req.body?.email === "string") {
    const nextEmail = req.body.email.trim().toLowerCase();
    const taken = await User.findOne({ email: nextEmail, _id: { $ne: target._id } });
    if (taken) {
      res.status(409).json({ error: "Email already in use" });
      return;
    }
    target.email = nextEmail;
  }
  if (req.body?.role === "admin" || req.body?.role === "user") {
    target.role = req.body.role;
  }
  if (typeof req.body?.password === "string" && req.body.password.length > 0) {
    target.password = await hashPassword(req.body.password);
  }

  await target.save();
  res.json({ user: toPublicUser(target) });
});

router.delete("/users/:id", async (req: AdminRequest, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    res.status(400).json({ error: "Invalid user id" });
    return;
  }
  if (id === req.adminUserId) {
    res.status(400).json({ error: "You cannot delete your own account" });
    return;
  }
  const target = await User.findById(id);
  if (!target) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  if (target.role === "admin") {
    const admins = await User.countDocuments({ role: "admin" });
    if (admins <= 1) {
      res.status(400).json({ error: "Cannot delete the last admin" });
      return;
    }
  }
  await User.deleteOne({ _id: target._id });
  res.status(204).send();
});

router.get("/jobs", async (_req, res) => {
  const jobs = await Job.find().sort({ createdAt: -1 }).lean();
  res.json(
    jobs.map((j) => ({
      id: String(j._id),
      title: j.title,
      department: j.department,
      description: j.description,
      status: j.status,
      createdAt: j.createdAt?.toISOString(),
      updatedAt: j.updatedAt?.toISOString(),
    }))
  );
});

router.post("/jobs", async (req, res) => {
  const title = typeof req.body?.title === "string" ? req.body.title.trim() : "";
  if (!title) {
    res.status(400).json({ error: "title is required" });
    return;
  }
  const department =
    typeof req.body?.department === "string" ? req.body.department.trim() : "General";
  const description = typeof req.body?.description === "string" ? req.body.description : "";
  const status =
    req.body?.status === "open" || req.body?.status === "closed" || req.body?.status === "draft"
      ? req.body.status
      : "open";
  const job = await Job.create({ title, department, description, status });
  res.status(201).json({
    job: {
      id: String(job._id),
      title: job.title,
      department: job.department,
      description: job.description,
      status: job.status,
      createdAt: job.createdAt?.toISOString(),
    },
  });
});

router.patch("/jobs/:id", async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    res.status(400).json({ error: "Invalid job id" });
    return;
  }
  const job = await Job.findById(id);
  if (!job) {
    res.status(404).json({ error: "Job not found" });
    return;
  }
  if (typeof req.body?.title === "string") {
    job.title = req.body.title.trim();
  }
  if (typeof req.body?.department === "string") {
    job.department = req.body.department.trim();
  }
  if (typeof req.body?.description === "string") {
    job.description = req.body.description;
  }
  if (req.body?.status === "open" || req.body?.status === "closed" || req.body?.status === "draft") {
    job.status = req.body.status;
  }
  await job.save();
  res.json({
    job: {
      id: String(job._id),
      title: job.title,
      department: job.department,
      description: job.description,
      status: job.status,
      updatedAt: job.updatedAt?.toISOString(),
    },
  });
});

router.delete("/jobs/:id", async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    res.status(400).json({ error: "Invalid job id" });
    return;
  }
  const result = await Job.deleteOne({ _id: id });
  if (result.deletedCount === 0) {
    res.status(404).json({ error: "Job not found" });
    return;
  }
  res.status(204).send();
});

router.get("/applications", async (_req, res) => {
  const items = await Application.find().sort({ createdAt: -1 }).limit(200).lean();
  res.json(
    items.map((a) => ({
      id: String(a._id),
      userId: String(a.userId),
      userName: a.userName,
      email: a.email,
      position: a.position,
      skills: a.skills,
      message: a.message,
      cvUrl: a.cvUrl,
      cvPublicId: a.cvPublicId,
      cvFileName: a.cvFileName,
      status: a.status,
      createdAt: a.createdAt?.toISOString(),
    }))
  );
});

router.patch("/applications/:id", async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    res.status(400).json({ error: "Invalid application id" });
    return;
  }
  const allowed = ["pending", "reviewed", "accepted", "rejected"] as const;
  const nextStatus = req.body?.status;
  if (!allowed.includes(nextStatus)) {
    res.status(400).json({ error: "Invalid status" });
    return;
  }
  const appDoc = await Application.findByIdAndUpdate(id, { status: nextStatus }, { new: true }).lean();
  if (!appDoc) {
    res.status(404).json({ error: "Application not found" });
    return;
  }
  res.json({
    application: {
      id: String(appDoc._id),
      status: appDoc.status,
    },
  });
});

export default router;
