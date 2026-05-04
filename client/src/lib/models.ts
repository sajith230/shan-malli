export type Role = "user" | "admin";

export type User = {
  id: string;
  name: string;
  email: string;
  password: string;
  role: Role;
};

export type JobApplication = {
  id: string;
  userId: string;
  userName: string;
  email: string;
  position: string;
  skills: string;
  message: string;
  createdAt: string;
};
