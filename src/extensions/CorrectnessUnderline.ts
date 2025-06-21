import { Extension } from "@tiptap/core"
import { Plugin, PluginKey } from "prosemirror-state"
import { Decoration, DecorationSet } from "prosemirror-view"
import { Suggestion as CheckerSuggestion } from "../lib/textChecker"

interface ExtendedSuggestion extends CheckerSuggestion {
  highlighted?: boolean
}

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

/**
 * Convert a 0-based character index (in the document's plain-text version)
 * to a ProseMirror position.
 */
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
  let blockCount = 0
  
  doc.descendants((node: any, pos: number) => {
    if (pos >= targetPos) return false
    
    // For each block node (paragraph), add a newline (except for the first)
    if (node.isBlock) {
      if (blockCount > 0) {
        charIdx += 1
      }
      blockCount++
    }
    
    if (node.isText && pos + node.nodeSize <= targetPos) {
      charIdx += node.text?.length || 0
    } else if (node.isText) {
      // Partial text node - only count up to targetPos
      charIdx += Math.max(0, targetPos - pos)
      return false
    }
    
    return true
  })
  return charIdx
}

export const correctnessUnderlineKey = new PluginKey("correctnessUnderline")

export const CorrectnessUnderline = Extension.create({
  name: "correctnessUnderline",

  addProseMirrorPlugins() {
    /** Build a DecorationSet from the given suggestions array. */
    const buildDecos = (doc: any, sel: any, suggestions: ExtendedSuggestion[]): DecorationSet => {
      const plain = getPlainText(doc)

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
          // Extend the decoration to cover the entire word
          const extended = extendDecorationToWord(doc, from, to)
          const className = s.highlighted 
            ? "tiptap-correctness-underline tiptap-highlighted" 
            : "tiptap-correctness-underline"
          decos.push(Decoration.inline(extended.from, extended.to, { class: className }))
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
            const meta = tr.getMeta(correctnessUnderlineKey) as { suggestions?: ExtendedSuggestion[] } | undefined
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