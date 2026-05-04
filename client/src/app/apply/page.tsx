"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useApp } from "@/components/app-provider";

export default function ApplyPage() {
  const { currentUser, submitApplication } = useApp();
  const [position, setPosition] = useState("AI Intern");
  const [skills, setSkills] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("");

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = submitApplication({ position, skills, message });
    setStatus(result.message);
    if (result.ok) {
      setSkills("");
      setMessage("");
    }
  }

  if (!currentUser) {
    return (
      <section className="page-container stagger-in">
        <div className="card">
          <h1 className="text-2xl font-bold">Apply Job</h1>
          <p className="mt-2 text-slate-600">You must login before submitting job applications.</p>
          <Link href="/login" className="mt-4 inline-block rounded-lg bg-cyan-500 px-4 py-2 text-white">
            Go to Login
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="page-container stagger-in space-y-5">
      <div className="card animate-fade-in">
        <h1 className="text-2xl font-bold">Apply Job</h1>
        <p className="mt-1 text-sm text-slate-600">
          Logged in as <span className="font-semibold">{currentUser.name}</span> ({currentUser.email})
        </p>
      </div>
      <form onSubmit={onSubmit} className="card mx-auto w-full max-w-3xl space-y-3">
        <select
          value={position}
          onChange={(event) => setPosition(event.target.value)}
          className="w-full rounded-lg border px-3 py-2"
        >
          <option>AI Intern</option>
          <option>Frontend Developer</option>
          <option>ML Engineer</option>
          <option>Data Analyst</option>
        </select>
        <input
          value={skills}
          onChange={(event) => setSkills(event.target.value)}
          className="w-full rounded-lg border px-3 py-2"
          placeholder="Skills (React, Python, NLP...)"
          required
        />
        <textarea
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          className="min-h-32 w-full rounded-lg border px-3 py-2"
          placeholder="Why are you a good fit?"
          required
        />
        <button type="submit" className="rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2 text-white">
          Submit Application
        </button>
        {status && <p className="text-sm font-medium text-slate-700">{status}</p>}
      </form>
    </section>
  );
}
