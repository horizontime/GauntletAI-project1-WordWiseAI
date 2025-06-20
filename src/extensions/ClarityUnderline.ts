import { Extension } from "@tiptap/core"
import { Plugin, PluginKey } from "prosemirror-state"
import { Decoration, DecorationSet } from "prosemirror-view"
import { Suggestion as CheckerSuggestion } from "../components/SuggestionSidebar"

// Helper functions reused from CorrectnessUnderline -------------------------
function charIndexToPos(doc: any, charIndex: number): number | null {
  let accumulated = 0
  let found: number | null = null

  doc.descendants((node: any, pos: number) => {
    if (node.isText) {
      const len = node.text?.length || 0
      if (accumulated + len >= charIndex) {
        found = pos + (charIndex - accumulated)
        return false
      }
      accumulated += len
    }
    return true
  })

  return found
}

function posToCharIndex(doc: any, targetPos: number): number {
  let charIdx = 0
  doc.descendants((node: any, pos: number) => {
    if (pos >= targetPos) return false
    if (node.isText) charIdx += node.text?.length || 0
    return true
  })
  return charIdx
}

export const clarityUnderlineKey = new PluginKey("clarityUnderline")

export const ClarityUnderline = Extension.create({
  name: "clarityUnderline",

  addProseMirrorPlugins() {
    const buildDecos = (doc: any, sel: any, suggestions: CheckerSuggestion[]): DecorationSet => {
      const plain = doc.textContent

      // Avoid underlining the word currently being typed (caret area) as in CorrectnessUnderline
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
        if (s.index == null) return
        if (s.index >= cutOff) return
        const start = s.index
        // Highlight up to next space or 5 characters minimum as fallback
        const nextSpace = plain.indexOf(" ", start)
        let end = nextSpace !== -1 ? nextSpace : start + 5
        if (end <= start) end = start + 1

        const from = charIndexToPos(doc, start)
        const to = charIndexToPos(doc, end)
        if (from !== null && to !== null && to > from) {
          decos.push(Decoration.inline(from, to, { class: "tiptap-clarity-underline" }))
        }
      })

      return DecorationSet.create(doc, decos)
    }

    return [
      new Plugin({
        key: clarityUnderlineKey,
        state: {
          init: () => DecorationSet.empty,
          apply(tr, old) {
            const meta = tr.getMeta(clarityUnderlineKey) as { suggestions?: CheckerSuggestion[] } | undefined
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