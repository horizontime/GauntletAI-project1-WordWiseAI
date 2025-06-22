import { useState } from "react"
import { Modal } from "./Modal"

interface GenerateTextModalProps {
  isOpen: boolean
  onClose: () => void
  /** Insert generated text into the editor */
  onInsert: (text: string) => void
  /** The plain-text content currently in the editor */
  currentText: string
}

const TONE_OPTIONS = [
  "Friendly",
  "Conversational",
  "Formal",
  "Academic",
  "Persuasive",
  "Motivational",
  "Humorous",
  "Dramatic",
  "Sarcastic",
]

const CONTENT_TYPE_OPTIONS = [
  "Paragraph",
  "Bullet list",
  "Numbered list",
  "Introduction",
  "Conclusion",
]

export function GenerateTextModal({ isOpen, onClose, onInsert, currentText }: GenerateTextModalProps) {
  const [topic, setTopic] = useState("")
  const [tone, setTone] = useState<string>(TONE_OPTIONS[0])
  const [sentences, setSentences] = useState<number>(3)
  const [contentType, setContentType] = useState<string>(CONTENT_TYPE_OPTIONS[0])

  const [loading, setLoading] = useState(false)
  const [output, setOutput] = useState<string>("")
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY as string | undefined

  // Checkbox should be checked by default, so start with `true`
  const [includeContext, setIncludeContext] = useState<boolean>(true)

  // Sophistication level (0 – 10)
  const [sophistication, setSophistication] = useState<number>(5)
  const sophisticationLabels = [
    "3rd grade",
    "4th grade",
    "5th grade",
    "6th grade",
    "7th grade",
    "8th grade",
    "9th grade",
    "10th grade",
    "11th grade",
    "12th grade",
    "college level",
  ]

  const handleGenerate = async () => {
    if (!apiKey || !topic.trim()) return

    setLoading(true)
    setOutput("")

    try {
      const readerLevel = sophisticationLabels[sophistication] || "college level"
      let prompt = `Write a ${contentType.toLowerCase()} about "${topic.trim()}" in a ${tone.toLowerCase()} tone appropriate for a ${readerLevel} reader. Limit to ${sentences} sentence${sentences === 1 ? "" : "s"}.`;

      if (includeContext && currentText.trim()) {
        prompt += `\n\nHere is the student's current writing for additional context:\n"""\n${currentText.trim()}\n"""`;
      }

      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.7,
        }),
      })

      const data = await res.json()
      const generated = data?.choices?.[0]?.message?.content?.trim() ?? ""
      setOutput(generated)
    } catch (err) {
      console.error("Generate text error", err)
    } finally {
      setLoading(false)
    }
  }

  const handleInsert = () => {
    if (!output.trim()) return
    onInsert(output.trim())
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="✨ What's on your mind? ✨">
      <div className="space-y-4 md:flex md:space-x-6">
        <div className="flex-1 space-y-4">
          {/* Topic */}
          <div>
            <label className="block text-sm font-medium">Topic / Prompt</label>
            <input
              className="mt-1 w-full rounded-md border-gray-300 focus:ring-blue-500 focus:border-blue-500"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Benefits of daily meditation"
            />
          </div>
          <hr className="border-t border-gray-200" />

          {/* Tone */}
          <div>
            <label className="block text-sm font-medium">Tone</label>
            <div className="mt-1 flex flex-wrap gap-2">
              {TONE_OPTIONS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTone(t)}
                  className={`px-3 py-1 rounded-full text-sm transition-colors duration-150 border ${
                    tone === t
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-gray-100 text-gray-800 hover:bg-gray-200 border-transparent"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <hr className="border-t border-gray-200" />

          {/* Content type */}
          <div>
            <label className="block text-sm font-medium">Content type</label>
            <div className="mt-1 flex flex-wrap gap-2">
              {CONTENT_TYPE_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setContentType(opt)}
                  className={`px-3 py-1 rounded-full text-sm transition-colors duration-150 border ${
                    contentType === opt
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-gray-100 text-gray-800 hover:bg-gray-200 border-transparent"
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
          <hr className="border-t border-gray-200" />

          {/* Sophistication Level */}
          <div>
            <label className="block text-sm font-medium">Sophistication Level: <span className="font-semibold">{sophistication}</span></label>
            <input
              type="range"
              min={0}
              max={10}
              step={1}
              value={sophistication}
              onChange={(e) => setSophistication(Number(e.target.value))}
              className="w-full mt-2"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>3rd grade</span>
              <span>College level</span>
            </div>
          </div>
          <hr className="border-t border-gray-200" />

          {/* Sentences */}
          <div className="w-32">
            <label className="block text-sm font-medium">Sentences (max 10)</label>
            <input
              type="number"
              min={1}
              max={10}
              className="mt-1 w-full rounded-md border-gray-300"
              value={sentences}
              onChange={(e) => setSentences(Math.min(10, Math.max(1, Number(e.target.value))))}
            />
          </div>
          <hr className="border-t border-gray-200" />

          {/* Include context */}
          <div className="flex items-center space-x-2">
            <input
              id="include-context-checkbox"
              type="checkbox"
              className="h-4 w-4 text-blue-600 border-gray-300 rounded"
              checked={includeContext}
              onChange={(e) => setIncludeContext(e.target.checked)}
            />
            <label htmlFor="include-context-checkbox" className="text-sm text-gray-700 select-none">
              Include your current writing as context?
            </label>
          </div>
        </div>

        {/* Preview column (hidden until output) */}
        {output && (
          <div className="mt-6 md:mt-0 md:w-1/2 flex flex-col">
            <h3 className="text-sm font-medium text-gray-700 mb-1">Preview</h3>
            <div className="prose flex-1 overflow-auto border rounded-md p-3 bg-gray-50 whitespace-pre-wrap">
              {output}
            </div>
            <button
              type="button"
              onClick={handleInsert}
              className="mt-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 focus:outline-none self-center"
            >
              Insert into Document
            </button>
          </div>
        )}
      </div>

      {/* Bottom action buttons */}
      <div className="flex justify-between pt-4 mx-40">
        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={loading || !topic.trim()}
          onClick={loading ? undefined : handleGenerate}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none disabled:opacity-50"
        >
          {loading ? "Generating…" : "Generate"}
        </button>
      </div>
    </Modal>
  )
} 