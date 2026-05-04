"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useApp } from "@/components/app-provider";
import { Role } from "@/lib/models";

export default function AdminPage() {
  const { currentUser, applications, addManualUser } = useApp();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("user");
  const [status, setStatus] = useState("");

  function onAddUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = addManualUser(name, email, password, role);
    setStatus(result.message);
    if (result.ok) {
      setName("");
      setEmail("");
      setPassword("");
      setRole("user");
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
      <div className="card animate-fade-in">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="mt-1 text-sm text-slate-600">
          View apply users table and add users manually for your project testing.
        </p>
      </div>

      <div className="card overflow-x-auto">
        <h2 className="mb-3 text-lg font-semibold">Applied Users Table</h2>
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b">
              <th className="px-2 py-2">Name</th>
              <th className="px-2 py-2">Email</th>
              <th className="px-2 py-2">Position</th>
              <th className="px-2 py-2">Skills</th>
              <th className="px-2 py-2">Date</th>
            </tr>
          </thead>
          <tbody>
            {applications.length === 0 ? (
              <tr>
                <td className="px-2 py-4 text-slate-500" colSpan={5}>
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
                    {new Date(item.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <form onSubmit={onAddUser} className="card space-y-3">
        <h2 className="text-lg font-semibold">Add Manual User</h2>
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
          Add User
        </button>
        {status && <p className="text-sm text-slate-700">{status}</p>}
      </form>
    </section>
  );
}
