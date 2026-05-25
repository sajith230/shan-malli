"use client";

import { createContext, ReactNode, useContext, useMemo, useState } from "react";
import { User } from "@/lib/models";
import { apiFetch } from "@/lib/api";

type AppContextType = {
  currentUser: User | null;
  login: (email: string, password: string) => Promise<{ ok: boolean; message: string }>;
  register: (name: string, email: string, password: string) => Promise<{ ok: boolean; message: string }>;
  logout: () => void;
  addManualUser: (
    name: string,
    email: string,
    password: string,
    role: "user" | "admin"
  ) => Promise<{ ok: boolean; message: string }>;
  submitApplication: (input: {
    position: string;
    skills: string;
    message: string;
    cvUrl: string;
    cvPublicId: string;
    cvFileName: string;
  }) => Promise<{ ok: boolean; message: string }>;
};

const CURRENT_USER_KEY = "campus_ai_current_user";

function isMongoObjectId(id: string): boolean {
  return /^[a-f\d]{24}$/i.test(id);
}

function readStoredUser(): User | null {
  if (typeof window === "undefined") {
    return null;
  }
  const raw = window.localStorage.getItem(CURRENT_USER_KEY);
  if (!raw) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw) as User;
    if (!parsed?.id || !parsed.email || !parsed.role) {
      return null;
    }
    if (!isMongoObjectId(parsed.id)) {
      window.localStorage.removeItem(CURRENT_USER_KEY);
      return null;
    }
    return {
      id: parsed.id,
      name: parsed.name,
      email: parsed.email,
      role: parsed.role,
    };
  } catch {
    return null;
  }
}

function persistUser(user: User | null) {
  if (typeof window === "undefined") {
    return;
  }
  if (!user) {
    window.localStorage.removeItem(CURRENT_USER_KEY);
    return;
  }
  window.localStorage.setItem(
    CURRENT_USER_KEY,
    JSON.stringify({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    })
  );
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(() => readStoredUser());

  const value = useMemo<AppContextType>(
    () => ({
      currentUser,
      async login(email, password) {
        try {
          const data = await apiFetch<{ user: User }>("/api/auth/login", {
            method: "POST",
            body: JSON.stringify({ email, password }),
          });
          const sessionUser: User = {
            id: data.user.id,
            name: data.user.name,
            email: data.user.email,
            role: data.user.role,
          };
          setCurrentUser(sessionUser);
          persistUser(sessionUser);
          return { ok: true, message: "Login successful." };
        } catch (err) {
          const message = err instanceof Error ? err.message : "Login failed.";
          return { ok: false, message };
        }
      },
      async register(name, email, password) {
        try {
          await apiFetch<{ user: User }>("/api/auth/register", {
            method: "POST",
            body: JSON.stringify({ name, email, password }),
          });
          return { ok: true, message: "Account created. Please login." };
        } catch (err) {
          const message = err instanceof Error ? err.message : "Registration failed.";
          return { ok: false, message };
        }
      },
      logout() {
        setCurrentUser(null);
        persistUser(null);
      },
      async addManualUser(name, email, password, role) {
        if (!currentUser?.id) {
          return { ok: false, message: "Not authenticated." };
        }
        try {
          await apiFetch<{ user: User }>("/api/admin/users", {
            method: "POST",
            userId: currentUser.id,
            body: JSON.stringify({ name, email, password, role }),
          });
          return { ok: true, message: "User added successfully." };
        } catch (err) {
          const message = err instanceof Error ? err.message : "Could not add user.";
          return { ok: false, message };
        }
      },
      async submitApplication(input) {
        if (!currentUser?.id) {
          return { ok: false, message: "Please login before applying." };
        }
        try {
          await apiFetch("/api/applications", {
            method: "POST",
            userId: currentUser.id,
            body: JSON.stringify({
              position: input.position,
              skills: input.skills,
              message: input.message,
              cvUrl: input.cvUrl,
              cvPublicId: input.cvPublicId,
              cvFileName: input.cvFileName,
            }),
          });
          return { ok: true, message: "Application submitted successfully." };
        } catch (err) {
          const message = err instanceof Error ? err.message : "Submit failed.";
          return { ok: false, message };
        }
      },
    }),
    [currentUser]
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
