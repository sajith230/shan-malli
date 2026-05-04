"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/components/app-provider";

export default function LoginPage() {
  const router = useRouter();
  const { login, register } = useApp();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result =
      mode === "login" ? login(email, password) : register(name, email, password);
    setStatus(result.message);
    if (mode === "login" && result.ok) {
      router.push("/apply");
    }
    if (mode === "register" && result.ok) {
      setMode("login");
    }
  }

  return (
    <section className="page-container stagger-in">
      <div className="card mx-auto max-w-md animate-fade-in">
        <h1 className="text-2xl font-bold">{mode === "login" ? "Login" : "Create Account"}</h1>
        <p className="mt-1 text-xs text-slate-500">
          Demo admin: admin@campus.ai / admin123
        </p>
        <form onSubmit={onSubmit} className="mt-4 space-y-3">
          {mode === "register" && (
            <input
              className="w-full rounded-lg border px-3 py-2"
              placeholder="Full name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />
          )}
          <input
            className="w-full rounded-lg border px-3 py-2"
            placeholder="Email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
          <input
            className="w-full rounded-lg border px-3 py-2"
            placeholder="Password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
          <button className="w-full rounded-lg bg-gradient-to-r from-slate-900 to-indigo-700 px-4 py-2 text-white" type="submit">
            {mode === "login" ? "Login" : "Register"}
          </button>
        </form>
        {status && <p className="mt-3 text-sm text-slate-700">{status}</p>}
        <button
          onClick={() => setMode((prev) => (prev === "login" ? "register" : "login"))}
          className="mt-3 text-sm text-cyan-700 underline"
        >
          {mode === "login" ? "Need an account? Register" : "Already have account? Login"}
        </button>
      </div>
    </section>
  );
}
