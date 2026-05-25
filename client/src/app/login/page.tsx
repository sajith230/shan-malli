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
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    try {
      if (mode === "login") {
        const result = await login(email, password);
        setStatus(result.message);
        if (result.ok) {
          router.push("/apply");
        }
      } else {
        const result = await register(name, email, password);
        setStatus(result.message);
        if (result.ok) {
          setMode("login");
        }
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="page-container stagger-in">
      <div className="card mx-auto max-w-md animate-fade-in">
        <h1 className="text-2xl font-bold">{mode === "login" ? "Login" : "Create Account"}</h1>
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
          <button
            className="w-full rounded-lg bg-gradient-to-r from-slate-900 to-indigo-700 px-4 py-2 text-white disabled:opacity-60"
            type="submit"
            disabled={pending}
          >
            {pending ? "Please wait…" : mode === "login" ? "Login" : "Register"}
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
