import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppProvider } from "@/components/app-provider";
import { Navbar } from "@/components/navbar";
import { ChatbotWidget } from "@/components/chatbot-widget";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Campus AI Job System",
  description: "Frontend demo project for campus research",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-slate-50">
        <AppProvider>
          <Navbar />
          <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 md:px-6">{children}</main>
          <footer className="mx-auto mt-10 w-full max-w-7xl px-4 pb-10 text-center text-sm text-slate-500 md:px-6">
            Campus AI Job System - Final Research Frontend
          </footer>
          <ChatbotWidget />
        </AppProvider>
      </body>
    </html>
  );
}
