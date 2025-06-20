import { Extension } from "@tiptap/core"
import { Plugin, PluginKey } from "prosemirror-state"
import { Decoration, DecorationSet } from "prosemirror-view"
import { Suggestion as CheckerSuggestion } from "../components/SuggestionSidebar"

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

export const deliveryUnderlineKey = new PluginKey("deliveryUnderline")

export const DeliveryUnderline = Extension.create({
  name: "deliveryUnderline",
  addProseMirrorPlugins() {
    const buildDecos = (doc: any, _sel: any, suggestions: CheckerSuggestion[]): DecorationSet => {
      const decos: Decoration[] = []
      suggestions.forEach((s) => {
        if (s.category !== "Delivery" || s.index == null) return
        const start = s.index
        const length = (s as any).length ?? 1
        const end = start + length
        const from = charIndexToPos(doc, start)
        const to = charIndexToPos(doc, end)
        if (from !== null && to !== null && to > from) {
          decos.push(Decoration.inline(from, to, { class: "tiptap-delivery-underline" }))
        }
      })
      return DecorationSet.create(doc, decos)
    }
    return [
      new Plugin({
        key: deliveryUnderlineKey,
        state: {
          init: () => DecorationSet.empty,
          apply(tr, old) {
            const meta = tr.getMeta(deliveryUnderlineKey) as { suggestions?: CheckerSuggestion[] } | undefined
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