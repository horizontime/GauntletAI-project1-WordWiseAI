import { Extension } from "@tiptap/core"
import { Plugin, PluginKey } from "prosemirror-state"
import { Decoration, DecorationSet } from "prosemirror-view"
import { Suggestion as CheckerSuggestion } from "../components/SuggestionSidebar"

/**
 * Extract plain text from the document in a way that matches editor.getText()
 * This ensures consistency between how the editor and plugins see the text.
 */
function getPlainText(doc: any): string {
  let text = ''
  let isFirst = true
  
  doc.descendants((node: any) => {
    if (node.isText) {
      text += node.text
    } else if (node.isBlock && !isFirst) {
      // Add newline before each block except the first
      text += '\n'
    }
    
    if (node.isBlock) {
      isFirst = false
    }
  })
  
  return text
}

/**
 * Extend decoration positions to cover entire words.
 * If any part of a word is underlined, extend the underline to cover the whole word.
 */
function extendDecorationToWord(doc: any, from: number, to: number): { from: number; to: number } {
  let extendedFrom = from
  let extendedTo = to
  
  // Walk backwards from 'from' to find word start
  doc.nodesBetween(Math.max(0, from - 50), from, (node: any, pos: number) => {
    if (node.isText && pos < from) {
      const text = node.text || ''
      const beforeFrom = Math.min(text.length, from - pos)
      
      // Find the last word boundary before our position
      for (let i = beforeFrom - 1; i >= 0; i--) {
        const char = text[i]
        if (!/\w/.test(char)) {
          extendedFrom = pos + i + 1
          return false
        }
      }
      // If we didn't find a boundary, the word starts at the beginning of this text node
      extendedFrom = pos
    }
  })
  
  // Walk forwards from 'to' to find word end
  doc.nodesBetween(to, Math.min(doc.content.size, to + 50), (node: any, pos: number) => {
    if (node.isText && pos + node.nodeSize > to) {
      const text = node.text || ''
      const afterTo = Math.max(0, to - pos)
      
      // Find the first word boundary after our position
      for (let i = afterTo; i < text.length; i++) {
        const char = text[i]
        if (!/\w/.test(char)) {
          extendedTo = pos + i
          return false
        }
      }
      // If we didn't find a boundary, the word ends at the end of this text node
      extendedTo = pos + text.length
    }
  })
  
  return { from: extendedFrom, to: extendedTo }
}

function charIndexToPos(doc: any, charIndex: number): number | null {
  let accumulated = 0
  let found: number | null = null
  let blockCount = 0

  doc.descendants((node: any, pos: number) => {
    // If we've already found the position, stop traversing
    if (found !== null) return false

    // For each block node (paragraph), we need to account for newlines
    if (node.isBlock) {
      // Add newline for all blocks except the first
      if (blockCount > 0) {
        accumulated += 1
        if (accumulated > charIndex) {
          // The position is in the newline itself, return start of this block
          found = pos
          return false
        }
      }
      blockCount++
    }

    if (node.isText) {
      const len = node.text?.length || 0
      if (accumulated + len > charIndex) {
        found = pos + (charIndex - accumulated)
        return false
      }
      accumulated += len
    }

    return true
  })

  return found
}

export const engagementUnderlineKey = new PluginKey("engagementUnderline")

export const EngagementUnderline = Extension.create({
  name: "engagementUnderline",
  addProseMirrorPlugins() {
    const buildDecos = (doc: any, _sel: any, suggestions: CheckerSuggestion[]): DecorationSet => {
      void _sel
      const decos: Decoration[] = []
      suggestions.forEach((s) => {
        if (s.category !== "Engagement" || s.index == null) return
        const start = s.index
        const length = (s as any).length ?? 1
        const end = start + length
        const from = charIndexToPos(doc, start)
        const to = charIndexToPos(doc, end)
        if (from !== null && to !== null && to > from) {
          // Extend the decoration to cover the entire word
          const extended = extendDecorationToWord(doc, from, to)
          decos.push(Decoration.inline(extended.from, extended.to, { class: "tiptap-engagement-underline" }))
        }
      })
      return DecorationSet.create(doc, decos)
    }
    return [
      new Plugin({
        key: engagementUnderlineKey,
        state: {
          init: () => DecorationSet.empty,
          apply(tr, old) {
            const meta = tr.getMeta(engagementUnderlineKey) as { suggestions?: CheckerSuggestion[] } | undefined
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