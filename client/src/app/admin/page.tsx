"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useApp } from "@/components/app-provider";
import { apiFetch } from "@/lib/api";
import type { JobApplication, Role, User } from "@/lib/models";

type Dashboard = {
  totals: {
    users: number;
    jobs: number;
    applications: number;
    pendingApplications: number;
  };
  usersByRole: Record<string, number>;
  jobsByStatus: Record<string, number>;
  applicationsLast7Days: { date: string; count: number }[];
};

type JobRow = {
  id: string;
  title: string;
  department: string;
  description: string;
  status: "open" | "closed" | "draft";
  createdAt?: string;
};

function BarGroup({
  title,
  entries,
  colorClass,
}: {
  title: string;
  entries: { label: string; value: number }[];
  colorClass: string;
}) {
  const max = Math.max(1, ...entries.map((e) => e.value));
  return (
    <div className="rounded-xl border border-slate-200 bg-white/80 p-4 shadow-sm">
      <h3 className="mb-3 text-sm font-semibold text-slate-800">{title}</h3>
      <div className="flex h-36 items-end gap-2">
        {entries.map((e) => (
          <div key={e.label} className="flex flex-1 flex-col items-center gap-1">
            <div
              className={`w-full max-w-[3rem] rounded-t-md ${colorClass} transition-all`}
              style={{ height: `${Math.max(8, (e.value / max) * 100)}%`, minHeight: e.value ? 8 : 4 }}
              title={`${e.label}: ${e.value}`}
            />
            <span className="max-w-full truncate text-center text-[10px] font-medium text-slate-600">
              {e.label}
            </span>
            <span className="text-xs font-bold text-slate-900">{e.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AdminPage() {
  const { currentUser, addManualUser } = useApp();
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [jobs, setJobs] = useState<JobRow[]>([]);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("user");
  const [formStatus, setFormStatus] = useState("");

  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editUserDraft, setEditUserDraft] = useState({ name: "", email: "", role: "user" as Role });

  const [editingJobId, setEditingJobId] = useState<string | null>(null);
  const [editJobDraft, setEditJobDraft] = useState({
    title: "",
    department: "",
    description: "",
    status: "open" as JobRow["status"],
  });

  const [newJob, setNewJob] = useState({
    title: "",
    department: "General",
    description: "",
    status: "open" as JobRow["status"],
  });

  const loadAll = useCallback(async () => {
    if (!currentUser?.id || currentUser.role !== "admin") {
      return;
    }
    try {
      const [dash, userList, jobList, appList] = await Promise.all([
        apiFetch<Dashboard>("/api/admin/dashboard", { userId: currentUser.id }),
        apiFetch<User[]>("/api/admin/users", { userId: currentUser.id }),
        apiFetch<JobRow[]>("/api/admin/jobs", { userId: currentUser.id }),
        apiFetch<JobApplication[]>("/api/admin/applications", { userId: currentUser.id }),
      ]);
      setLoadError(null);
      setDashboard(dash);
      setUsers(userList);
      setJobs(jobList);
      setApplications(appList);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Failed to load admin data");
    }
  }, [currentUser]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadAll();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadAll]);

  const roleBars = useMemo(() => {
    const d = dashboard?.usersByRole ?? {};
    return Object.entries(d).map(([label, value]) => ({ label, value }));
  }, [dashboard]);

  const statusBars = useMemo(() => {
    const d = dashboard?.jobsByStatus ?? {};
    return Object.entries(d).map(([label, value]) => ({ label, value }));
  }, [dashboard]);

  const trendBars = useMemo(() => {
    const days = dashboard?.applicationsLast7Days ?? [];
    return days.map((row) => ({
      label: row.date.slice(5),
      value: row.count,
    }));
  }, [dashboard]);

  async function onAddUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = await addManualUser(name, email, password, role);
    setFormStatus(result.message);
    if (result.ok) {
      setName("");
      setEmail("");
      setPassword("");
      setRole("user");
      await loadAll();
    }
  }

  function startEditUser(u: User) {
    setEditingUserId(u.id);
    setEditUserDraft({ name: u.name, email: u.email, role: u.role });
  }

  async function saveUser(id: string) {
    if (!currentUser?.id) {
      return;
    }
    try {
      await apiFetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        userId: currentUser.id,
        body: JSON.stringify(editUserDraft),
      });
      setEditingUserId(null);
      await loadAll();
    } catch (err) {
      setFormStatus(err instanceof Error ? err.message : "Update failed");
    }
  }

  async function deleteUser(id: string) {
    if (!currentUser?.id) {
      return;
    }
    if (!window.confirm("Delete this user?")) {
      return;
    }
    try {
      await apiFetch(`/api/admin/users/${id}`, {
        method: "DELETE",
        userId: currentUser.id,
      });
      await loadAll();
    } catch (err) {
      setFormStatus(err instanceof Error ? err.message : "Delete failed");
    }
  }

  function startEditJob(j: JobRow) {
    setEditingJobId(j.id);
    setEditJobDraft({
      title: j.title,
      department: j.department,
      description: j.description,
      status: j.status,
    });
  }

  async function saveJob(id: string) {
    if (!currentUser?.id) {
      return;
    }
    try {
      await apiFetch(`/api/admin/jobs/${id}`, {
        method: "PATCH",
        userId: currentUser.id,
        body: JSON.stringify(editJobDraft),
      });
      setEditingJobId(null);
      await loadAll();
    } catch (err) {
      setFormStatus(err instanceof Error ? err.message : "Job update failed");
    }
  }

  async function createJob(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!currentUser?.id) {
      return;
    }
    try {
      await apiFetch("/api/admin/jobs", {
        method: "POST",
        userId: currentUser.id,
        body: JSON.stringify(newJob),
      });
      setNewJob({ title: "", department: "General", description: "", status: "open" });
      await loadAll();
    } catch (err) {
      setFormStatus(err instanceof Error ? err.message : "Could not create job");
    }
  }

  async function deleteJob(id: string) {
    if (!currentUser?.id) {
      return;
    }
    if (!window.confirm("Delete this job posting?")) {
      return;
    }
    try {
      await apiFetch(`/api/admin/jobs/${id}`, {
        method: "DELETE",
        userId: currentUser.id,
      });
      await loadAll();
    } catch (err) {
      setFormStatus(err instanceof Error ? err.message : "Delete failed");
    }
  }

  async function setApplicationStatus(id: string, status: JobApplication["status"]) {
    if (!currentUser?.id) {
      return;
    }
    try {
      await apiFetch(`/api/admin/applications/${id}`, {
        method: "PATCH",
        userId: currentUser.id,
        body: JSON.stringify({ status }),
      });
      await loadAll();
    } catch (err) {
      setFormStatus(err instanceof Error ? err.message : "Status update failed");
    }
  }

  if (!currentUser) {
    return (
      <section className="page-container stagger-in">
        <div className="card">
          <h1 className="text-2xl font-bold">Admin Panel</h1>
          <p className="mt-2 text-slate-600">Please login as admin to access this page.</p>
          <Link href="/login" className="mt-4 inline-block rounded-lg bg-cyan-500 px-4 py-2 text-white">
            Go to Login
          </Link>
        </div>
      </section>
    );
  }

  if (currentUser.role !== "admin") {
    return (
      <section className="page-container stagger-in">
        <div className="card">
          <h1 className="text-2xl font-bold">Admin Panel</h1>
          <p className="mt-2 text-red-600">Access denied. Your role is not admin.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="page-container stagger-in space-y-5">
      <div className="card animate-fade-in flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <p className="mt-1 text-sm text-slate-600">
            MongoDB-backed users, jobs, and applications. Edit inline and refresh charts from live data.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void loadAll()}
          className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-800 hover:bg-slate-50"
        >
          Refresh data
        </button>
      </div>

      {loadError && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          {loadError}
        </div>
      )}

      {dashboard && (
        <div className="grid gap-4 md:grid-cols-4">
          <div className="card border-indigo-100 bg-gradient-to-br from-indigo-50 to-white">
            <p className="text-xs font-medium uppercase tracking-wide text-indigo-600">Users</p>
            <p className="mt-1 text-3xl font-bold text-slate-900">{dashboard.totals.users}</p>
          </div>
          <div className="card border-emerald-100 bg-gradient-to-br from-emerald-50 to-white">
            <p className="text-xs font-medium uppercase tracking-wide text-emerald-600">Jobs</p>
            <p className="mt-1 text-3xl font-bold text-slate-900">{dashboard.totals.jobs}</p>
          </div>
          <div className="card border-cyan-100 bg-gradient-to-br from-cyan-50 to-white">
            <p className="text-xs font-medium uppercase tracking-wide text-cyan-600">Applications</p>
            <p className="mt-1 text-3xl font-bold text-slate-900">{dashboard.totals.applications}</p>
          </div>
          <div className="card border-amber-100 bg-gradient-to-br from-amber-50 to-white">
            <p className="text-xs font-medium uppercase tracking-wide text-amber-700">Pending review</p>
            <p className="mt-1 text-3xl font-bold text-slate-900">{dashboard.totals.pendingApplications}</p>
          </div>
        </div>
      )}

      {dashboard && (
        <div className="grid gap-4 lg:grid-cols-3">
          <BarGroup title="Users by role" entries={roleBars.length ? roleBars : [{ label: "—", value: 0 }]} colorClass="bg-indigo-500" />
          <BarGroup title="Jobs by status" entries={statusBars.length ? statusBars : [{ label: "—", value: 0 }]} colorClass="bg-emerald-500" />
          <BarGroup
            title="Applications (last 7 days)"
            entries={trendBars.length ? trendBars : [{ label: "—", value: 0 }]}
            colorClass="bg-cyan-500"
          />
        </div>
      )}

      <div className="card overflow-x-auto">
        <h2 className="mb-3 text-lg font-semibold">Users</h2>
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b bg-slate-50/80">
              <th className="px-2 py-2">Name</th>
              <th className="px-2 py-2">Email</th>
              <th className="px-2 py-2">Role</th>
              <th className="px-2 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b">
                {editingUserId === u.id ? (
                  <>
                    <td className="px-2 py-2">
                      <input
                        className="w-full rounded border px-2 py-1"
                        value={editUserDraft.name}
                        onChange={(e) => setEditUserDraft((d) => ({ ...d, name: e.target.value }))}
                      />
                    </td>
                    <td className="px-2 py-2">
                      <input
                        className="w-full rounded border px-2 py-1"
                        value={editUserDraft.email}
                        onChange={(e) => setEditUserDraft((d) => ({ ...d, email: e.target.value }))}
                      />
                    </td>
                    <td className="px-2 py-2">
                      <select
                        className="rounded border px-2 py-1"
                        value={editUserDraft.role}
                        onChange={(e) => setEditUserDraft((d) => ({ ...d, role: e.target.value as Role }))}
                      >
                        <option value="user">user</option>
                        <option value="admin">admin</option>
                      </select>
                    </td>
                    <td className="space-x-2 px-2 py-2">
                      <button type="button" className="text-emerald-700 underline" onClick={() => void saveUser(u.id)}>
                        Save
                      </button>
                      <button type="button" className="text-slate-600 underline" onClick={() => setEditingUserId(null)}>
                        Cancel
                      </button>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-2 py-2">{u.name}</td>
                    <td className="px-2 py-2">{u.email}</td>
                    <td className="px-2 py-2">
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium">{u.role}</span>
                    </td>
                    <td className="space-x-2 px-2 py-2">
                      <button type="button" className="text-indigo-700 underline" onClick={() => startEditUser(u)}>
                        Edit
                      </button>
                      <button
                        type="button"
                        className="text-red-600 underline disabled:opacity-40"
                        disabled={u.id === currentUser.id}
                        onClick={() => void deleteUser(u.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card overflow-x-auto">
        <h2 className="mb-3 text-lg font-semibold">Job postings</h2>
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead>
            <tr className="border-b bg-slate-50/80">
              <th className="px-2 py-2">Title</th>
              <th className="px-2 py-2">Department</th>
              <th className="px-2 py-2">Status</th>
              <th className="px-2 py-2">Description</th>
              <th className="px-2 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((j) => (
              <tr key={j.id} className="border-b align-top">
                {editingJobId === j.id ? (
                  <>
                    <td className="px-2 py-2">
                      <input
                        className="w-full rounded border px-2 py-1"
                        value={editJobDraft.title}
                        onChange={(e) => setEditJobDraft((d) => ({ ...d, title: e.target.value }))}
                      />
                    </td>
                    <td className="px-2 py-2">
                      <input
                        className="w-full rounded border px-2 py-1"
                        value={editJobDraft.department}
                        onChange={(e) => setEditJobDraft((d) => ({ ...d, department: e.target.value }))}
                      />
                    </td>
                    <td className="px-2 py-2">
                      <select
                        className="rounded border px-2 py-1"
                        value={editJobDraft.status}
                        onChange={(e) =>
                          setEditJobDraft((d) => ({ ...d, status: e.target.value as JobRow["status"] }))
                        }
                      >
                        <option value="open">open</option>
                        <option value="closed">closed</option>
                        <option value="draft">draft</option>
                      </select>
                    </td>
                    <td className="px-2 py-2">
                      <textarea
                        className="min-h-16 w-full rounded border px-2 py-1"
                        value={editJobDraft.description}
                        onChange={(e) => setEditJobDraft((d) => ({ ...d, description: e.target.value }))}
                      />
                    </td>
                    <td className="space-x-2 px-2 py-2">
                      <button type="button" className="text-emerald-700 underline" onClick={() => void saveJob(j.id)}>
                        Save
                      </button>
                      <button type="button" className="text-slate-600 underline" onClick={() => setEditingJobId(null)}>
                        Cancel
                      </button>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-2 py-2 font-medium">{j.title}</td>
                    <td className="px-2 py-2">{j.department}</td>
                    <td className="px-2 py-2">
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-800">
                        {j.status}
                      </span>
                    </td>
                    <td className="max-w-xs truncate px-2 py-2 text-slate-600" title={j.description}>
                      {j.description}
                    </td>
                    <td className="space-x-2 px-2 py-2">
                      <button type="button" className="text-indigo-700 underline" onClick={() => startEditJob(j)}>
                        Edit
                      </button>
                      <button type="button" className="text-red-600 underline" onClick={() => void deleteJob(j.id)}>
                        Delete
                      </button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>

        <form onSubmit={createJob} className="mt-4 grid gap-2 border-t border-slate-200 pt-4 md:grid-cols-2">
          <h3 className="md:col-span-2 text-sm font-semibold text-slate-800">Add job</h3>
          <input
            className="rounded-lg border px-3 py-2"
            placeholder="Title"
            value={newJob.title}
            onChange={(e) => setNewJob((j) => ({ ...j, title: e.target.value }))}
            required
          />
          <input
            className="rounded-lg border px-3 py-2"
            placeholder="Department"
            value={newJob.department}
            onChange={(e) => setNewJob((j) => ({ ...j, department: e.target.value }))}
          />
          <select
            className="rounded-lg border px-3 py-2"
            value={newJob.status}
            onChange={(e) => setNewJob((j) => ({ ...j, status: e.target.value as JobRow["status"] }))}
          >
            <option value="open">open</option>
            <option value="closed">closed</option>
            <option value="draft">draft</option>
          </select>
          <textarea
            className="min-h-20 rounded-lg border px-3 py-2 md:col-span-2"
            placeholder="Description"
            value={newJob.description}
            onChange={(e) => setNewJob((j) => ({ ...j, description: e.target.value }))}
          />
          <button
            type="submit"
            className="rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2 text-sm text-white md:col-span-2"
          >
            Create job
          </button>
        </form>
      </div>

      <div className="card overflow-x-auto">
        <h2 className="mb-3 text-lg font-semibold">Applications</h2>
        <table className="w-full min-w-[980px] text-left text-sm">
          <thead>
            <tr className="border-b bg-slate-50/80">
              <th className="px-2 py-2">Name</th>
              <th className="px-2 py-2">Email</th>
              <th className="px-2 py-2">Position</th>
              <th className="px-2 py-2">Skills</th>
              <th className="px-2 py-2">CV</th>
              <th className="px-2 py-2">Status</th>
              <th className="px-2 py-2">Date</th>
            </tr>
          </thead>
          <tbody>
            {applications.length === 0 ? (
              <tr>
                <td className="px-2 py-4 text-slate-500" colSpan={7}>
                  No applications yet.
                </td>
              </tr>
            ) : (
              applications.map((item) => (
                <tr key={item.id} className="border-b">
                  <td className="px-2 py-2">{item.userName}</td>
                  <td className="px-2 py-2">{item.email}</td>
                  <td className="px-2 py-2">{item.position}</td>
                  <td className="px-2 py-2">{item.skills}</td>
                  <td className="px-2 py-2">
                    {item.cvUrl ? (
                      <a
                        href={item.cvUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="font-medium text-cyan-700 hover:underline"
                      >
                        {item.cvFileName || "View CV"}
                      </a>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-2 py-2">
                    <select
                      className="rounded border px-2 py-1 text-xs"
                      value={item.status}
                      onChange={(e) =>
                        void setApplicationStatus(item.id, e.target.value as JobApplication["status"])
                      }
                    >
                      <option value="pending">pending</option>
                      <option value="reviewed">reviewed</option>
                      <option value="accepted">accepted</option>
                      <option value="rejected">rejected</option>
                    </select>
                  </td>
                  <td className="px-2 py-2 whitespace-nowrap">
                    {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <form onSubmit={onAddUser} className="card space-y-3">
        <h2 className="text-lg font-semibold">Add user (admin)</h2>
        <div className="grid gap-3 md:grid-cols-2">
          <input
            className="rounded-lg border px-3 py-2"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Name"
            required
          />
          <input
            className="rounded-lg border px-3 py-2"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Email"
            type="email"
            required
          />
          <input
            className="rounded-lg border px-3 py-2"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Password"
            required
          />
          <select
            className="rounded-lg border px-3 py-2"
            value={role}
            onChange={(event) => setRole(event.target.value as Role)}
          >
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <button className="rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2 text-white" type="submit">
          Add user
        </button>
        {formStatus && <p className="text-sm text-slate-700">{formStatus}</p>}
      </form>
    </section>
  );
}
