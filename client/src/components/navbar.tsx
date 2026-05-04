"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useApp } from "./app-provider";

const links = [
  { href: "/", label: "Home" },
  { href: "/contact", label: "Contact" },
  { href: "/apply", label: "Apply Job" },
  { href: "/settings", label: "Settings" },
];

export function Navbar() {
  const pathname = usePathname();
  const { currentUser, logout } = useApp();

  return (
    <header className="sticky top-0 z-20 border-b border-indigo-100 bg-white/90 backdrop-blur-xl">
      <nav className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-3 text-slate-900 md:px-6">
        <div className="bg-gradient-to-r from-indigo-700 to-cyan-600 bg-clip-text text-lg font-bold tracking-wide text-transparent">
          Campus AI Job System
        </div>
        <div className="flex items-center gap-2 md:gap-3">
          {links.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-full px-3 py-1 text-sm transition ${
                  isActive
                    ? "bg-indigo-600 text-white"
                    : "text-slate-700 hover:bg-indigo-50 hover:text-indigo-700"
                }`}
              >
                {item.label}
              </Link>
            );
          })}

          {currentUser?.role === "admin" && (
            <Link
              href="/admin"
              className={`rounded-full px-3 py-1 text-sm transition ${
                pathname === "/admin"
                  ? "bg-emerald-600 text-white"
                  : "text-slate-700 hover:bg-emerald-50 hover:text-emerald-700"
              }`}
            >
              Admin
            </Link>
          )}

          {!currentUser ? (
            <Link href="/login" className="rounded-full bg-indigo-600 px-3 py-1 text-sm text-white">
              Login
            </Link>
          ) : (
            <button
              onClick={logout}
              className="rounded-full border border-indigo-200 px-3 py-1 text-sm text-slate-700 hover:bg-indigo-50"
            >
              Logout ({currentUser.name})
            </button>
          )}
        </div>
      </nav>
    </header>
  );
}
