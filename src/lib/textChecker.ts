import wordList from "an-array-of-english-words"
import nspell from "nspell"

/** --------------------------------------------------------------
 *  Dictionary – loaded once and reused
 * --------------------------------------------------------------*/
// Build a minimal Hunspell‐style dictionary for nspell using the
// existing word list.  We generate a simple affix file that only
// defines the required UTF-8 encoding and pass all words (one per
// line) as the dictionary body.  The first line of the dictionary
// encodes the word count as required by the Hunspell format.

const WORD_ARRAY = Array.from(new Set(wordList.map((w) => w.toLowerCase())))

// Minimal affix: just declare UTF-8 so nspell is happy.
const AFFIX_DATA = "SET UTF-8\n"

// Hunspell dictionaries start with a line that indicates how many
// entries follow.  We concatenate the unique words afterwards.
const DICT_DATA = `${WORD_ARRAY.length}\n${WORD_ARRAY.join("\n")}`

// Create the nspell instance once and reuse it for every invocation.
const SPELLER = nspell({ aff: AFFIX_DATA, dic: DICT_DATA })

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
function getClosestWords(word: string, limit = 3): string[] {
  const lower = word.toLowerCase()

  // If the word is known, nothing to suggest.
  if (SPELLER.correct(lower)) return []

  // nspell already returns suggestions ranked by edit distance and
  // other heuristics.  Simply take the top results.
  return SPELLER.suggest(lower).slice(0, limit)
}

function spellingCheck(text: string): Issue[] {
  const issues: Issue[] = []
  let m: RegExpExecArray | null
  while ((m = RE_WORD.exec(text))) {
    const word = m[0]
    const lower = word.toLowerCase()

    if (!SPELLER.correct(lower)) {
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

    if (word[0] === word[0].toUpperCase() && !isAllCaps && SPELLER.correct(lower)) {
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
    } else if (iss.type === "Punctuation") {
      candidates = [".", "?", "!"]
    } else if (iss.type === "Capitalisation") {
      // Extract the word inside the quotes to generate case options
      const match = iss.message.match(/"\s*(.+?)\s*"/)
      if (match) {
        const word = match[1]
        const lower = word.toLowerCase()
        const proper = word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        const upper = word.toUpperCase()
        candidates = Array.from(new Set([lower, proper, upper])).filter((w) => w !== word)

        // Build excerpt replacing current word with lowercase as primary fix
        const primary = candidates[0] ?? lower
        excerpt = `<del>${word}</del> → <strong>${primary}</strong>`
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