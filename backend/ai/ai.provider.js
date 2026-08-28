// Provider abstraction: ai.service.js only ever calls
// generateResponse(messages) and gets plain text back. It never knows
// or cares whether the reply came from Groq, OpenAI, Anthropic, or
// Gemini. Swapping providers is a matter of changing env vars, not
// code, and adding a new provider means adding one branch here.
//
// Env vars used:
//   AI_PROVIDER      "groq" | "openai" | "anthropic" | "gemini"
//   AI_MODEL         provider-specific model name
//   AI_API_KEY       provider API key (never sent to the frontend)
//   AI_TIMEOUT_MS    optional, defaults to 15000

import { AppError } from "../utils/AppError.js";

const PROVIDER = (process.env.AI_PROVIDER || "groq").toLowerCase();
const MODEL = process.env.AI_MODEL;
const API_KEY = process.env.AI_API_KEY;
const TIMEOUT_MS = parseInt(process.env.AI_TIMEOUT_MS) || 15000;

// messages: [{ role: "system" | "user" | "assistant", content: string }]
export const generateResponse = async (messages) => {
  if (!API_KEY) {
    throw new AppError("AI assistant is not configured", 503);
  }

  try {
    switch (PROVIDER) {
      case "groq":
        return await callOpenAICompatible(
          "https://api.groq.com/openai/v1/chat/completions",
          messages,
        );
      case "openai":
        return await callOpenAICompatible(
          "https://api.openai.com/v1/chat/completions",
          messages,
        );
      case "anthropic":
        return await callAnthropic(messages);
      case "gemini":
        return await callGemini(messages);
      default:
        throw new AppError(`Unsupported AI_PROVIDER: ${PROVIDER}`, 500);
    }
  } catch (error) {
    if (error instanceof AppError) throw error;

    if (error?.name === "AbortError") {
      throw new AppError("AI assistant took too long to respond", 504);
    }

    // Never leak provider internals (status text, raw body, API key
    // presence, etc.) to the client.
    console.error("AI provider error:", error);
    throw new AppError("AI assistant is temporarily unavailable", 503);
  }
};

const withTimeout = () => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  return { signal: controller.signal, clear: () => clearTimeout(timer) };
};

// Groq and OpenAI share the same request/response shape.
const callOpenAICompatible = async (url, messages) => {
  const { signal, clear } = withTimeout();

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages,
        temperature: 0.7,
      }),
      signal,
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new Error(`Provider request failed (${response.status}): ${body}`);
    }

    const data = await response.json();
    const text = data?.choices?.[0]?.message?.content;

    if (!text) throw new Error("Provider returned an empty response");

    return text;
  } finally {
    clear();
  }
};

const callAnthropic = async (messages) => {
  const { signal, clear } = withTimeout();

  try {
    const systemMessage = messages.find((m) => m.role === "system");
    const conversation = messages
      .filter((m) => m.role !== "system")
      .map((m) => ({ role: m.role, content: m.content }));

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1024,
        system: systemMessage?.content,
        messages: conversation,
      }),
      signal,
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new Error(`Provider request failed (${response.status}): ${body}`);
    }

    const data = await response.json();
    const text = data?.content?.find((b) => b.type === "text")?.text;

    if (!text) throw new Error("Provider returned an empty response");

    return text;
  } finally {
    clear();
  }
};

const callGemini = async (messages) => {
  const { signal, clear } = withTimeout();

  try {
    const systemMessage = messages.find((m) => m.role === "system");
    const contents = messages
      .filter((m) => m.role !== "system")
      .map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      }));

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents,
        systemInstruction: systemMessage
          ? { parts: [{ text: systemMessage.content }] }
          : undefined,
      }),
      signal,
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new Error(`Provider request failed (${response.status}): ${body}`);
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) throw new Error("Provider returned an empty response");

    return text;
  } finally {
    clear();
  }
};
