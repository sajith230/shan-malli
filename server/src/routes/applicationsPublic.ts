import mongoose from "mongoose";
import { Router } from "express";
import { sendApplicationConfirmationEmail } from "../lib/email.js";
import { User } from "../models/User.js";
import { Application } from "../models/Application.js";

const router = Router();

router.post("/", async (req, res) => {
  const userId = req.header("x-user-id");
  if (!userId || !mongoose.isValidObjectId(userId)) {
    res.status(401).json({ error: "Missing or invalid x-user-id header" });
    return;
  }
  const user = await User.findById(userId);
  if (!user) {
    res.status(401).json({ error: "User not found" });
    return;
  }
  const position = typeof req.body?.position === "string" ? req.body.position.trim() : "";
  const skills = typeof req.body?.skills === "string" ? req.body.skills.trim() : "";
  const message = typeof req.body?.message === "string" ? req.body.message.trim() : "";
  const cvUrl = typeof req.body?.cvUrl === "string" ? req.body.cvUrl.trim() : "";
  const cvPublicId = typeof req.body?.cvPublicId === "string" ? req.body.cvPublicId.trim() : "";
  const cvFileName = typeof req.body?.cvFileName === "string" ? req.body.cvFileName.trim() : "";
  if (!position) {
    res.status(400).json({ error: "position is required" });
    return;
  }
  if (!cvUrl.startsWith("https://res.cloudinary.com/")) {
    res.status(400).json({ error: "Cloudinary CV upload is required" });
    return;
  }
  const doc = await Application.create({
    userId: user._id,
    userName: user.name,
    email: user.email,
    position,
    skills,
    message,
    cvUrl,
    cvPublicId,
    cvFileName,
  });

  let confirmationEmailSent = false;
  try {
    confirmationEmailSent = await sendApplicationConfirmationEmail({
      to: user.email,
      name: user.name,
      position,
      skills,
      message,
    });
  } catch (err) {
    console.error("Failed to send application confirmation email", err);
  }

  res.status(201).json({
    confirmationEmailSent,
    application: {
      id: String(doc._id),
      userId: String(doc.userId),
      userName: doc.userName,
      email: doc.email,
      position: doc.position,
      skills: doc.skills,
      message: doc.message,
      cvUrl: doc.cvUrl,
      cvPublicId: doc.cvPublicId,
      cvFileName: doc.cvFileName,
      status: doc.status,
      createdAt: doc.createdAt?.toISOString(),
    },
  });
});

export default router;
