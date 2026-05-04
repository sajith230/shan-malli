"use client";

import { useApp } from "@/components/app-provider";

export default function SettingsPage() {
  const { currentUser } = useApp();

  return (
    <section className="page-container stagger-in space-y-4">
      <div className="card animate-fade-in">
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="mt-1 text-slate-600">Profile, preferences, and system details for demo UI.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="card">
          <h2 className="font-semibold">Profile</h2>
          {!currentUser ? (
            <p className="mt-2 text-sm text-slate-600">Please login to view your profile settings.</p>
          ) : (
            <div className="mt-2 space-y-1 text-sm text-slate-700">
              <p>Name: {currentUser.name}</p>
              <p>Email: {currentUser.email}</p>
              <p>Role: {currentUser.role}</p>
            </div>
          )}
        </div>
        <div className="card">
          <h2 className="font-semibold">Interface Settings</h2>
          <ul className="mt-2 list-inside list-disc text-sm text-slate-600">
            <li>Animated cards and transitions enabled</li>
            <li>Floating chatbot enabled</li>
            <li>Responsive navigation for web and admin sections</li>
          </ul>
        </div>
      </div>
    </section>
  );
}
