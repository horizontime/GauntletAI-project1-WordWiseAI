import { Suggestion } from "./textChecker"

// Narrow the Suggestion category to the three AI-powered ones (excludes "Correctness").
export type AICategory = Exclude<Suggestion["category"], "Correctness">

export interface AISuggestion extends Suggestion {
  // Placeholder for future AI-specific metadata (e.g. explanation, score).
  // For now we simply re-use the Suggestion shape from the UI layer.
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

// Few-shot prompt templates per category. These can evolve over time but we
// initialise them here so we have something functional out of the gate.
const SYSTEM_PROMPTS: Record<AICategory, string> = {
  Clarity:
    "You are a writing coach helping students rewrite sentences for conciseness and clarity while preserving meaning. Return ONLY valid JSON matching the given schema.",
  Engagement:
    "You are a writing coach helping students make their writing more vivid and engaging with descriptive language. Return ONLY valid JSON matching the given schema.",
  Delivery:
    "You are a writing coach helping students improve tone, flow, and readability. Return ONLY valid JSON matching the given schema.",
}

// The JSON schema we expect from the assistant. The assistant MUST respond
// with an array of objects implementing the Suggestion interface.
const JSON_SCHEMA_DESCRIPTION = `Return a JSON array where each element has:
  id: string (uuid),
  title: string (reuse the category name),
  excerpt: string (HTML using <del> & <strong> to highlight changes),
  category: one of Clarity | Engagement | Delivery,
  candidates?: string[] (optional list of replacement strings)
No additional keys are allowed.`

async function callOpenAI(rawText: string, category: AICategory): Promise<string> {
  const apiKey = import.meta.env.VITE_OPENAI_KEY as string | undefined
  if (!apiKey) {
    throw new Error("VITE_OPENAI_KEY is missing. Please add it to your environment variables.")
  }

  const body = {
    model: "gpt-3.5-turbo",
    temperature: 0.7,
    messages: [
      { role: "system", content: SYSTEM_PROMPTS[category] + " " + JSON_SCHEMA_DESCRIPTION },
      { role: "user", content: rawText },
    ],
  }

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`OpenAI API error (${res.status}): ${errText}`)
  }

  const data = (await res.json()) as {
    choices: { message: { content: string } }[]
  }

  return data.choices[0]?.message?.content ?? "[]"
}

/**
 * Public helper that calls OpenAI and parses the response into Suggestion
 * objects consumable by the existing UI. Will never throw on JSON parse
 * errors – instead returns an empty array so the app can keep running.
 */
export async function getSuggestions(
  text: string,
  category: AICategory,
): Promise<AISuggestion[]> {
  try {
    const raw = await callOpenAI(text, category)
    const parsed = JSON.parse(raw) as AISuggestion[]
    // Ensure the category is set correctly (the assistant may omit it).
    parsed.forEach((s) => (s.category = category))
    // Enforce max 5 suggestions as per PRD.
    return parsed.slice(0, 5)
  } catch (err) {
    console.error("[OpenAIService]", err)
    return []
  }
} 