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

// Prompt templates tailored to each improvement category. We keep them short so
// they fit comfortably within the context window but still provide enough
// guidance for the assistant.  We explicitly instruct the assistant to return
// **no more than three** suggestions so that the UI receives exactly the number
// requested in the PRD.
const SYSTEM_PROMPTS: Record<AICategory, string> = {
  Clarity:
    "You are a writing coach who specialises in making prose concise, unambiguous and grammatically sound. Given some STUDENT_TEXT you will propose succinct rewrites that preserve meaning while improving clarity. Return ONLY valid JSON matching the schema and provide **at most 3** suggestions.",
  Engagement:
    "You are a writing coach who helps students craft vivid, compelling prose. Given some STUDENT_TEXT suggest rewrites that increase reader interest using descriptive language and storytelling devices. Return ONLY valid JSON matching the schema and provide **at most 3** suggestions.",
  Delivery:
    "You are a writing coach focused on tone, flow and readability. Given some STUDENT_TEXT offer rewrites that smooth the flow, strengthen transitions and adopt an encouraging academic tone. Return ONLY valid JSON matching the schema and provide **at most 3** suggestions.",
}

// The JSON schema we expect from the assistant. The assistant MUST respond
// with an array of objects implementing the Suggestion interface.
const JSON_SCHEMA_DESCRIPTION = `Return a JSON array (maximum 3 items) where each element has:
  id: string (uuid),
  title: string (always set to the category name),
  excerpt: string (HTML snippet using <del> and <strong> to show before/after),
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

// ---------------------------------------------------------------------------
// Response sanitation helpers
// ---------------------------------------------------------------------------

/**
 * OpenAI frequently wraps JSON answers in markdown code-fences (```json\n ... ```).
 * This helper removes those fences so the string can be safely parsed.
 */
function stripMarkdownFences(raw: string): string {
  const trimmed = raw.trim()
  if (trimmed.startsWith("```")) {
    // Remove leading fence e.g. ```json or ```
    const withoutStart = trimmed.replace(/^```(?:json)?\s*/i, "")
    // Remove trailing fence
    return withoutStart.replace(/\s*```\s*$/i, "").trim()
  }
  return trimmed
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
    const jsonString = stripMarkdownFences(raw)
    const parsed = JSON.parse(jsonString) as AISuggestion[]
    // Normalise category field: if missing, fill with requested category; if
    // present but mismatched (e.g. assistant hallucinated), discard so we
    // don't pollute other tabs.
    const normalised: AISuggestion[] = []
    for (const s of parsed) {
      if (!s.category) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore – we populate the field post-parse.
        s.category = category
        normalised.push(s)
      } else if (s.category === category) {
        normalised.push(s)
      }
    }

    // Enforce max 3 suggestions as per updated requirements.
    return normalised.slice(0, 3)
  } catch (err) {
    console.error("[OpenAIService]", err)
    return []
  }
} 