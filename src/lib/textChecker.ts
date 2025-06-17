import wordList from "an-array-of-english-words"

/** --------------------------------------------------------------
 *  Dictionary – loaded once and reused
 * --------------------------------------------------------------*/
const DICT_LOWER = new Set<string>(wordList.map((w) => w.toLowerCase()))

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

function spellingCheck(text: string): Issue[] {
  const issues: Issue[] = []
  let m: RegExpExecArray | null
  while ((m = RE_WORD.exec(text))) {
    const word = m[0]
    const lower = word.toLowerCase()

    if (!DICT_LOWER.has(lower)) {
      issues.push({
        type: "Spelling",
        index: m.index,
        message: `" ${word} " is not in the dictionary.`,
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
}

export function checkText(text: string): Suggestion[] {
  const issues = [
    ...spellingCheck(text),
    ...grammarCheck(text),
    ...capitalisationCheck(text),
  ]

  return issues.map((iss) => {
    let excerpt = iss.message

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

    return {
      id: `${iss.type}-${iss.index}`,
      category: "Correctness", // map all basic errors to Correctness
      title: iss.type,
      excerpt,
    }
  })
} 