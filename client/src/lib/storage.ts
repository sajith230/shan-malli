"use client";

import { JobApplication, User } from "./models";

const USERS_KEY = "campus_ai_users";
const APPLICATIONS_KEY = "campus_ai_applications";

const defaultUsers: User[] = [
  {
    id: "admin-1",
    name: "System Admin",
    email: "admin@campus.ai",
    password: "admin123",
    role: "admin",
  },
];

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") {
    return fallback;
  }

  const raw = window.localStorage.getItem(key);
  if (!raw) {
    return fallback;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T) {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(key, JSON.stringify(value));
}

export function getUsers(): User[] {
  const users = read<User[]>(USERS_KEY, defaultUsers);
  if (!users.some((user) => user.role === "admin")) {
    write(USERS_KEY, defaultUsers);
    return defaultUsers;
  }
  return users;
}

export function saveUsers(users: User[]) {
  write(USERS_KEY, users);
}

export function getApplications(): JobApplication[] {
  return read<JobApplication[]>(APPLICATIONS_KEY, []);
}

export function saveApplications(applications: JobApplication[]) {
  write(APPLICATIONS_KEY, applications);
}
