import wordList from "an-array-of-english-words"

/** --------------------------------------------------------------
 *  Dictionary – loaded once and reused
 * --------------------------------------------------------------*/
const WORD_ARRAY = wordList.map((w) => w.toLowerCase())
const DICT_LOWER = new Set<string>(WORD_ARRAY)

/** --------------------------------------------------------------
 *  Regex helpers
 * --------------------------------------------------------------*/
const RE_SENTENCE = /[^.!?]+[.!?]*/g // rough sentence splitter
const RE_REPEAT = /\b(\w+)\b\s+\1\b/gi
const RE_WORD = /\b[a-zA-Z']+\b/g

export interface Issue {
  type: "Spelling" | "Capitalisation" | "Repeated word" | "Punctuation" | "Sentence start"
  index: number // 0-based character offset
  message: string
}

/** Run all checks against plain text and return Issue objects */
function grammarCheck(text: string): Issue[] {
  const issues: Issue[] = []

  /* repeated words --------------------------------------------------*/
  let m: RegExpExecArray | null
  while ((m = RE_REPEAT.exec(text))) {
    issues.push({
      type: "Repeated word",
      index: m.index,
      message: `Repeated word " ${m[1]} ".`,
    })
  }

  /* sentence must start with capital --------------------------------*/
  const sentences = text.match(RE_SENTENCE) ?? []
  let cursor = 0
  sentences.forEach((s) => {
    const firstIdx = s.search(/\S/)
    const firstCh = s[firstIdx]
    if (firstCh && firstCh === firstCh.toLowerCase()) {
      issues.push({
        type: "Sentence start",
        index: cursor + firstIdx,
        message: "Sentence should start with a capital letter.",
      })
    }
    cursor += s.length
  })

  /* trailing punctuation -------------------------------------------*/
  if (!/[.!?]\s*$/.test(text) && text.trim() !== "") {
    issues.push({
      type: "Punctuation",
      index: text.length - 1,
      message: "Add a period, question mark, or exclamation point.",
    })
  }

  return issues
}

/** --------------------------------------------------------------
 *  Levenshtein distance helper (small implementation)
 * --------------------------------------------------------------*/
function levenshtein(a: string, b: string): number {
  const m = a.length
  const n = b.length
  const dp: number[] = Array(n + 1)
  for (let j = 0; j <= n; j++) dp[j] = j

  for (let i = 1; i <= m; i++) {
    let prev = i - 1
    dp[0] = i
    for (let j = 1; j <= n; j++) {
      const tmp = dp[j]
      if (a[i - 1] === b[j - 1]) {
        dp[j] = prev
      } else {
        dp[j] = Math.min(prev + 1, dp[j] + 1, dp[j - 1] + 1)
      }
      prev = tmp
    }
  }
  return dp[n]
}

function getClosestWords(word: string, limit = 3): string[] {
  const lower = word.toLowerCase()

  // Fast path: if dictionary contains word, return empty array.
  if (DICT_LOWER.has(lower)) return []

  // Only consider words with the same first letter and length within ±2 to speed up.
  const first = lower[0]
  const len = lower.length

  const candidates: { w: string; d: number }[] = []

  for (const w of WORD_ARRAY) {
    if (w[0] !== first) continue
    if (Math.abs(w.length - len) > 2) continue
    const dist = levenshtein(lower, w)
    if (dist <= 3) {
      candidates.push({ w, d: dist })
    }
  }

  candidates.sort((a, b) => a.d - b.d)
  return candidates.slice(0, limit).map((c) => c.w)
}

function spellingCheck(text: string): Issue[] {
  const issues: Issue[] = []
  let m: RegExpExecArray | null
  while ((m = RE_WORD.exec(text))) {
    const word = m[0]
    const lower = word.toLowerCase()

    if (!DICT_LOWER.has(lower)) {
      const suggestions = getClosestWords(word, 3)
      issues.push({
        type: "Spelling",
        index: m.index,
        message: `" ${word} " is not in the dictionary.${
          suggestions.length ? ` Did you mean: ${suggestions.join(", ")}?` : ""
        }`,
      })
    }
  }
  return issues
}

function capitalisationCheck(text: string): Issue[] {
  const issues: Issue[] = []
  let m: RegExpExecArray | null
  while ((m = RE_WORD.exec(text))) {
    const idx = m.index
    const word = m[0]

    // Determine if start of sentence (previous non-space char)
    const prev = text.slice(0, idx).trimEnd().slice(-1)
    const isStartOfSentence = !prev || /[.!?]/.test(prev)
    if (isStartOfSentence) continue

    const isAllCaps = word === word.toUpperCase()
    const isMixed = !isAllCaps && word !== word.toLowerCase()

    const lower = word.toLowerCase()

    if (isMixed) {
      issues.push({
        type: "Capitalisation",
        index: idx,
        message: `Unexpected casing in " ${word} ".`,
      })
      continue
    }

    if (word[0] === word[0].toUpperCase() && !isAllCaps && DICT_LOWER.has(lower)) {
      issues.push({
        type: "Capitalisation",
        index: idx,
        message: `" ${word} " should be lowercase here.`,
      })
    }
  }
  return issues
}

/** Public helper converting issues → SuggestionSidebar format */
export interface Suggestion {
  id: string
  category: "Correctness" | "Clarity" | "Engagement" | "Delivery"
  title: string
  excerpt: string // simple HTML snippet
  candidates?: string[] // optional replacement list for spelling
}

export function checkText(text: string): Suggestion[] {
  const issues = [
    ...spellingCheck(text),
    ...grammarCheck(text),
    ...capitalisationCheck(text),
  ]

  return issues.map((iss) => {
    let excerpt = iss.message
    let candidates: string[] | undefined

    // Provide replacement preview for sentence capitalisation so the editor can auto-fix it
    if (iss.type === "Sentence start") {
      // Extract the word starting at the issue index
      const tail = text.slice(iss.index)
      const match = tail.match(RE_WORD)
      if (match) {
        const original = match[0]
        const replacement = original.charAt(0).toUpperCase() + original.slice(1)
        excerpt = `<del>${original}</del> → <strong>${replacement}</strong>`
      }
    }

    if (iss.type === "Spelling") {
      // Extract the word inside the quotes for candidates
      const match = iss.message.match(/"\s*(.+?)\s*"/)
      if (match) {
        const misspelled = match[1]
        candidates = getClosestWords(misspelled, 3)
      }
    }

    return {
      id: `${iss.type}-${iss.index}`,
      category: "Correctness", // map all basic errors to Correctness
      title: iss.type,
      excerpt,
      candidates,
    }
  })
} 