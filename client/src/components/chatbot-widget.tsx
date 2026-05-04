"use client";

import { FormEvent, useMemo, useState } from "react";

type ChatMessage = {
  by: "user" | "bot";
  text: string;
};

const suggestions = [
  { key: "apply", answer: "Go to Apply Job page, login, and submit your form." },
  { key: "contact", answer: "Use the Contact page form or email careers@campusai.edu." },
  { key: "admin", answer: "Admin can view applications and add users manually from Admin page." },
];

function botReply(input: string) {
  const text = input.toLowerCase();
  const found = suggestions.find((item) => text.includes(item.key));
  if (found) {
    return found.answer;
  }
  return "I can help with login, apply process, contact details, and admin features.";
}

export function ChatbotWidget() {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    { by: "bot", text: "Hi, I am Campus Assistant. Ask me about jobs or admin flow." },
  ]);

  const canSend = useMemo(() => value.trim().length > 0, [value]);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSend) {
      return;
    }
    const userText = value.trim();
    setValue("");
    setMessages((prev) => [...prev, { by: "user", text: userText }]);
    window.setTimeout(() => {
      setMessages((prev) => [...prev, { by: "bot", text: botReply(userText) }]);
    }, 300);
  }

  return (
    <div className="fixed bottom-5 right-5 z-30">
      {open && (
        <section className="animate-fade-in mb-3 w-80 rounded-2xl border border-slate-200 bg-white shadow-2xl">
          <div className="rounded-t-2xl bg-gradient-to-r from-slate-900 to-indigo-700 px-4 py-3 text-sm font-semibold text-white">
            Online Chat Bot
          </div>
          <div className="h-64 space-y-2 overflow-y-auto p-3 text-sm">
            {messages.map((message, index) => (
              <div
                key={`${message.by}-${index}`}
                className={`max-w-[85%] rounded-xl px-3 py-2 ${
                  message.by === "bot"
                    ? "bg-slate-100 text-slate-900"
                    : "ml-auto bg-cyan-500 text-white"
                }`}
              >
                {message.text}
              </div>
            ))}
          </div>
          <form onSubmit={onSubmit} className="flex gap-2 border-t p-3">
            <input
              value={value}
              onChange={(event) => setValue(event.target.value)}
              placeholder="Ask here..."
              className="w-full rounded-lg border px-2 py-1 text-sm outline-none focus:border-cyan-500"
            />
            <button
              type="submit"
              className="rounded-lg bg-cyan-500 px-3 py-1 text-sm font-semibold text-white disabled:opacity-40"
              disabled={!canSend}
            >
              Send
            </button>
          </form>
        </section>
      )}

      <button
        onClick={() => setOpen((prev) => !prev)}
        className="animate-bounce-soft rounded-full bg-gradient-to-r from-cyan-500 to-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-lg"
      >
        {open ? "Close Chat" : "Chat Bot"}
      </button>
    </div>
  );
}
