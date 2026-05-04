"use client";

import { createContext, ReactNode, useContext, useMemo, useState } from "react";
import { JobApplication, User } from "@/lib/models";
import { getApplications, getUsers, saveApplications, saveUsers } from "@/lib/storage";

type AppContextType = {
  users: User[];
  applications: JobApplication[];
  currentUser: User | null;
  login: (email: string, password: string) => { ok: boolean; message: string };
  register: (name: string, email: string, password: string) => { ok: boolean; message: string };
  logout: () => void;
  addManualUser: (
    name: string,
    email: string,
    password: string,
    role: "user" | "admin"
  ) => { ok: boolean; message: string };
  submitApplication: (input: {
    position: string;
    skills: string;
    message: string;
  }) => { ok: boolean; message: string };
};

const CURRENT_USER_KEY = "campus_ai_current_user";

const AppContext = createContext<AppContextType | null>(null);

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

function getInitialUsers() {
  return getUsers();
}

function getInitialApplications() {
  return getApplications();
}

function getInitialCurrentUser(users: User[]) {
  if (typeof window === "undefined") {
    return null;
  }
  const rawCurrentUser = window.localStorage.getItem(CURRENT_USER_KEY);
  if (!rawCurrentUser) {
    return null;
  }
  try {
    const parsed = JSON.parse(rawCurrentUser) as User;
    return users.find((user) => user.id === parsed.id) ?? null;
  } catch {
    return null;
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<User[]>(() => getInitialUsers());
  const [applications, setApplications] = useState<JobApplication[]>(() =>
    getInitialApplications()
  );
  const [currentUser, setCurrentUser] = useState<User | null>(() =>
    getInitialCurrentUser(getInitialUsers())
  );

  const value = useMemo<AppContextType>(
    () => ({
      users,
      applications,
      currentUser,
      login(email, password) {
        const user = users.find((item) => item.email === email && item.password === password);
        if (!user) {
          return { ok: false, message: "Invalid email or password." };
        }
        setCurrentUser(user);
        window.localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
        return { ok: true, message: "Login successful." };
      },
      register(name, email, password) {
        const exists = users.some((item) => item.email.toLowerCase() === email.toLowerCase());
        if (exists) {
          return { ok: false, message: "User already exists with this email." };
        }
        const newUser: User = {
          id: createId("user"),
          name,
          email,
          password,
          role: "user",
        };
        const nextUsers = [...users, newUser];
        setUsers(nextUsers);
        saveUsers(nextUsers);
        return { ok: true, message: "Account created. Please login." };
      },
      logout() {
        setCurrentUser(null);
        window.localStorage.removeItem(CURRENT_USER_KEY);
      },
      addManualUser(name, email, password, role) {
        const exists = users.some((item) => item.email.toLowerCase() === email.toLowerCase());
        if (exists) {
          return { ok: false, message: "A user with this email already exists." };
        }
        const newUser: User = {
          id: createId("user"),
          name,
          email,
          password,
          role,
        };
        const nextUsers = [...users, newUser];
        setUsers(nextUsers);
        saveUsers(nextUsers);
        return { ok: true, message: "User added successfully." };
      },
      submitApplication(input) {
        if (!currentUser) {
          return { ok: false, message: "Please login before applying." };
        }
        const newApplication: JobApplication = {
          id: createId("app"),
          userId: currentUser.id,
          userName: currentUser.name,
          email: currentUser.email,
          position: input.position,
          skills: input.skills,
          message: input.message,
          createdAt: new Date().toISOString(),
        };
        const nextApplications = [newApplication, ...applications];
        setApplications(nextApplications);
        saveApplications(nextApplications);
        return { ok: true, message: "Application submitted successfully." };
      },
    }),
    [applications, currentUser, users]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used inside AppProvider.");
  }
  return context;
}
