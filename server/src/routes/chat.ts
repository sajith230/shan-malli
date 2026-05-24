import { Router } from "express";

const router = Router();

const localSuggestions = [
  { key: "apply", answer: "Go to Apply Job page, login, and submit your form." },
  { key: "contact", answer: "Use the Contact page form or email careers@campusai.edu." },
  { key: "admin", answer: "Admin can view applications and manage jobs from the Admin page (admin role required)." },
];

function localBotReply(input: string, noKeyHint: string): string {
  const text = input.toLowerCase();
  const found = localSuggestions.find((item) => text.includes(item.key));
  if (found) {
    return found.answer;
  }
  return noKeyHint;
}

function systemPrompt(): string {
  return (
    process.env.CHATBOT_SYSTEM_PROMPT?.trim() ||
    "You are Campus AI Job System assistant. Be brief and helpful. Topics: job applications, login/register, admin dashboard, job postings."
  );
}

type OpenAiStyleResponse = {
  choices?: { message?: { content?: string } }[];
};

type GeminiResponse = {
  candidates?: {
    content?: { parts?: { text?: string }[] };
    finishReason?: string;
  }[];
  error?: { message?: string; code?: number };
};

async function callOpenAiCompatible(
  message: string,
  apiKey: string,
  apiUrl: string,
  model: string
): Promise<{ ok: true; reply: string } | { ok: false; status: number; body: string }> {
  const upstream = await fetch(apiUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt() },
        { role: "user", content: message },
      ],
      max_tokens: 512,
      temperature: 0.4,
    }),
  });
  const raw = await upstream.text();
  if (!upstream.ok) {
    return { ok: false, status: upstream.status, body: raw };
  }
  let data: OpenAiStyleResponse;
  try {
    data = JSON.parse(raw) as OpenAiStyleResponse;
  } catch {
    return { ok: false, status: 502, body: "invalid json" };
  }
  const reply = data.choices?.[0]?.message?.content?.trim();
  if (!reply) {
    return { ok: false, status: 502, body: "empty choices" };
  }
  return { ok: true, reply };
}

async function callGemini(message: string, apiKey: string, model: string): Promise<{ ok: true; reply: string } | { ok: false; status: number; body: string }> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const upstream = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemPrompt() }] },
      contents: [{ parts: [{ text: message }] }],
      generationConfig: {
        maxOutputTokens: 512,
        temperature: 0.4,
      },
    }),
  });
  const raw = await upstream.text();
  if (!upstream.ok) {
    return { ok: false, status: upstream.status, body: raw };
  }
  let data: GeminiResponse;
  try {
    data = JSON.parse(raw) as GeminiResponse;
  } catch {
    return { ok: false, status: 502, body: "invalid json" };
  }
  if (data.error?.message) {
    return { ok: false, status: data.error.code ?? 502, body: data.error.message };
  }
  const parts = data.candidates?.[0]?.content?.parts;
  const reply = parts?.map((p) => p.text ?? "").join("").trim();
  if (!reply) {
    return { ok: false, status: 502, body: "empty candidates" };
  }
  return { ok: true, reply };
}

function geminiUserWarning(status: number, body: string): string {
  const b = body.toLowerCase();
  if (b.includes("consumer_suspended") || b.includes("has been suspended")) {
    return "Google suspended this Cloud project or the API key (CONSUMER_SUSPENDED). Fix it in Google Cloud Console (billing, appeals, or a new project), then create a new key in AI Studio. Or switch to Groq/OpenAI: set CHATBOT_API_KEY and CHATBOT_PROVIDER=openai in server/.env.";
  }
  if (status === 403 && b.includes("permission_denied")) {
    return "Gemini permission denied. Enable the Generative Language API for your project, check billing/quota, or use a new API key.";
  }
  if (b.includes("api_key_invalid") || b.includes("invalid api key")) {
    return "Invalid Gemini API key. Create a new key in Google AI Studio and update CHATBOT_GEMINI_API_KEY.";
  }
  return `Gemini error (${status}). Showing built-in reply.`;
}

function pickProvider(): "gemini" | "openai" | "none" {
  const geminiKey = process.env.CHATBOT_GEMINI_API_KEY?.trim();
  const openaiKey = process.env.CHATBOT_API_KEY?.trim();
  const explicit = process.env.CHATBOT_PROVIDER?.trim().toLowerCase();

  if (explicit === "gemini" && geminiKey) {
    return "gemini";
  }
  if (explicit === "openai" && openaiKey) {
    return "openai";
  }
  if (geminiKey && !openaiKey) {
    return "gemini";
  }
  if (openaiKey && !geminiKey) {
    return "openai";
  }
  if (geminiKey && openaiKey) {
    return explicit === "openai" ? "openai" : "gemini";
  }
  return "none";
}

router.post("/", async (req, res) => {
  const message = typeof req.body?.message === "string" ? req.body.message.trim() : "";
  if (!message) {
    res.status(400).json({ error: "message is required" });
    return;
  }

  const noKeyHint =
    "I can help with login, apply process, contact details, and admin features. Set CHATBOT_GEMINI_API_KEY or CHATBOT_API_KEY in server/.env for AI answers.";

  const provider = pickProvider();
  if (provider === "none") {
    res.json({
      reply: localBotReply(message, noKeyHint),
      source: "local" as const,
      hint: "Add CHATBOT_GEMINI_API_KEY (Google AI Studio) or CHATBOT_API_KEY (OpenAI / Groq) in server/.env.",
    });
    return;
  }

  try {
    if (provider === "gemini") {
      const apiKey = process.env.CHATBOT_GEMINI_API_KEY!.trim();
      const model = process.env.CHATBOT_GEMINI_MODEL?.trim() || "gemini-2.0-flash";
      const result = await callGemini(message, apiKey, model);
      if (!result.ok) {
        console.error("Gemini HTTP", result.status, result.body.slice(0, 500));
        res.json({
          reply: localBotReply(message, noKeyHint),
          source: "local" as const,
          warning: geminiUserWarning(result.status, result.body),
        });
        return;
      }
      res.json({ reply: result.reply, source: "api" as const, provider: "gemini" });
      return;
    }

    const apiKey = process.env.CHATBOT_API_KEY!.trim();
    const apiUrl =
      process.env.CHATBOT_API_URL?.trim() || "https://api.openai.com/v1/chat/completions";
    const model = process.env.CHATBOT_MODEL?.trim() || "gpt-4o-mini";
    const result = await callOpenAiCompatible(message, apiKey, apiUrl, model);
    if (!result.ok) {
      console.error("OpenAI-compatible HTTP", result.status, result.body.slice(0, 500));
      res.json({
        reply: localBotReply(message, noKeyHint),
        source: "local" as const,
        warning: `AI provider error (${result.status}). Showing built-in reply instead.`,
      });
      return;
    }
    res.json({ reply: result.reply, source: "api" as const, provider: "openai" });
  } catch (err) {
    console.error("Chat route error", err);
    res.json({
      reply: localBotReply(message, noKeyHint),
      source: "local" as const,
      warning: "Could not reach AI provider.",
    });
  }
});

export default router;
