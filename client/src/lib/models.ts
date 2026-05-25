export type Role = "user" | "admin";

/** Logged-in user (no password stored client-side when using API). */
export type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
  password?: string;
};

export type JobApplication = {
  id: string;
  userId: string;
  userName: string;
  email: string;
  position: string;
  skills: string;
  message: string;
  cvUrl?: string;
  cvPublicId?: string;
  cvFileName?: string;
  status: "pending" | "reviewed" | "accepted" | "rejected";
  createdAt: string;
};

export type JobPosting = {
  id: string;
  title: string;
  department: string;
  description: string;
  status: "open" | "closed" | "draft";
};
