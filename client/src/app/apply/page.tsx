"use client";

import Link from "next/link";
import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { useApp } from "@/components/app-provider";
import { apiFetch } from "@/lib/api";
import { uploadCvToCloudinary, type CloudinaryUploadResult } from "@/lib/cloudinary";
import type { JobPosting } from "@/lib/models";

export default function ApplyPage() {
  const { currentUser, submitApplication } = useApp();
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [position, setPosition] = useState("");
  const [skills, setSkills] = useState("");
  const [message, setMessage] = useState("");
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [uploadedCv, setUploadedCv] = useState<CloudinaryUploadResult | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadingCv, setUploadingCv] = useState(false);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [status, setStatus] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await apiFetch<JobPosting[]>("/api/jobs");
        if (!cancelled) {
          setJobs(list);
          if (list.length > 0) {
            setPosition(list[0].title);
          }
        }
      } catch {
        if (!cancelled) {
          setJobs([]);
          setPosition((p) => p || "AI Intern");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  function onCvChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setCvFile(file);
    setUploadedCv(null);
    setUploadProgress(0);
    setStatus("");
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!cvFile) {
      setStatus("Please upload your CV before submitting.");
      return;
    }

    setPending(true);
    setUploadingCv(true);
    setUploadProgress(1);
    try {
      const cv = uploadedCv ?? (await uploadCvToCloudinary(cvFile, setUploadProgress));
      setUploadedCv(cv);
      setUploadingCv(false);

      const result = await submitApplication({
        position,
        skills,
        message,
        cvUrl: cv.secureUrl,
        cvPublicId: cv.publicId,
        cvFileName: cvFile.name,
      });
      setStatus(result.message);
      if (result.ok) {
        setSkills("");
        setMessage("");
        setCvFile(null);
        setUploadedCv(null);
        setUploadProgress(0);
        setFileInputKey((key) => key + 1);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "CV upload failed.";
      setStatus(errorMessage);
    } finally {
      setUploadingCv(false);
      setPending(false);
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

  const fallbackTitles = ["AI Intern", "Frontend Developer", "ML Engineer", "Data Analyst"];
  const isBusy = pending || uploadingCv;

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
          required
        >
          {jobs.length === 0
            ? fallbackTitles.map((title) => (
                <option key={title} value={title}>
                  {title}
                </option>
              ))
            : jobs.map((job) => (
                <option key={job.id} value={job.title}>
                  {job.title} — {job.department}
                </option>
              ))}
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
        <div className="rounded-xl border border-dashed border-cyan-300 bg-cyan-50/60 p-4">
          <label className="block text-sm font-semibold text-slate-800" htmlFor="cv-upload">
            Upload CV
          </label>
          <input
            key={fileInputKey}
            id="cv-upload"
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={onCvChange}
            className="mt-2 w-full rounded-lg border bg-white px-3 py-2 text-sm"
            disabled={isBusy}
            required
          />
          <p className="mt-1 text-xs text-slate-500">Accepted formats: PDF, DOC, DOCX.</p>
          {cvFile && <p className="mt-2 text-sm text-slate-700">Selected: {cvFile.name}</p>}
          {uploadingCv && (
            <div className="mt-3 rounded-lg bg-white p-3 shadow-sm">
              <div className="flex items-center justify-between text-sm font-medium text-cyan-700">
                <span className="animate-pulse">Uploading CV...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-cyan-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-emerald-500 transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}
          {uploadedCv && !uploadingCv && (
            <p className="mt-2 text-sm font-medium text-emerald-700">CV uploaded successfully.</p>
          )}
        </div>
        <button
          type="submit"
          className="rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2 text-white disabled:opacity-60"
          disabled={isBusy}
        >
          {uploadingCv ? "Uploading CV…" : pending ? "Submitting…" : "Submit Application"}
        </button>
        {status && <p className="text-sm font-medium text-slate-700">{status}</p>}
      </form>
    </section>
  );
}
