import { Extension } from "@tiptap/core"
import { Plugin, PluginKey } from "prosemirror-state"
import { Decoration, DecorationSet } from "prosemirror-view"
import { Suggestion as CheckerSuggestion } from "../lib/textChecker"

/**
 * Convert a 0-based character index (in the document's plain-text version)
 * to a ProseMirror position.
 */
function charIndexToPos(doc: any, charIndex: number): number | null {
  let accumulated = 0
  let found: number | null = null

  doc.descendants((node: any, pos: number) => {
    if (node.isText) {
      const len = node.text?.length || 0
      if (accumulated + len >= charIndex) {
        found = pos + (charIndex - accumulated)
        return false // stop traversal
      }
      accumulated += len
    }
    return true
  })

  return found
}

/** Map a ProseMirror position to its character index in plain text. */
function posToCharIndex(doc: any, targetPos: number): number {
  let charIdx = 0
  doc.descendants((node: any, pos: number) => {
    if (pos >= targetPos) return false
    if (node.isText) charIdx += node.text?.length || 0
    return true
  })
  return charIdx
}

export const correctnessUnderlineKey = new PluginKey("correctnessUnderline")

export const CorrectnessUnderline = Extension.create({
  name: "correctnessUnderline",

  addProseMirrorPlugins() {
    /** Build a DecorationSet from the given suggestions array. */
    const buildDecos = (doc: any, sel: any, suggestions: CheckerSuggestion[]): DecorationSet => {
      const plain = doc.textContent

      // Exclude the word currently being typed (caret position)
      let cutOff = plain.length
      if (sel?.empty) {
        const caretIdx = posToCharIndex(doc, sel.from)
        const before = plain.slice(0, caretIdx)
        const idxSpace = before.lastIndexOf(" ")
        const idxNl = Math.max(before.lastIndexOf("\n"), before.lastIndexOf("\t"))
        const lastIdx = Math.max(idxSpace, idxNl)
        cutOff = lastIdx === -1 ? 0 : lastIdx + 1
      }

      const decos: Decoration[] = []
      suggestions.forEach((s) => {
        if (s.index >= cutOff) return
        const start = s.index

        // Extend highlight to full word if possible
        let end = start + 1
        const m = plain.slice(start).match(/^\w[\w']*/)
        if (m) end = start + m[0].length

        const from = charIndexToPos(doc, start)
        const to = charIndexToPos(doc, end)
        if (from !== null && to !== null && to > from) {
          decos.push(Decoration.inline(from, to, { class: "tiptap-correctness-underline" }))
        }
      })

      return DecorationSet.create(doc, decos)
    }

    return [
      new Plugin({
        key: correctnessUnderlineKey,
        state: {
          init: () => DecorationSet.empty,
          apply(tr, old) {
            const meta = tr.getMeta(correctnessUnderlineKey) as { suggestions?: CheckerSuggestion[] } | undefined
            if (meta && meta.suggestions) {
              return buildDecos(tr.doc, tr.selection, meta.suggestions)
            }
            return old.map(tr.mapping, tr.doc)
          },
        },
        props: {
          decorations(state) {
            return (this as any).getState(state)
          },
        },
      }),
    ]
  },
}) 