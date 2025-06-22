import { useState, useEffect } from 'react'
import { Modal } from './Modal'
import { WritingScore } from '../types/writingScore'
import { LoadingSpinner } from './LoadingSpinner'
import { InfoIcon, TrendingUpIcon } from 'lucide-react'

interface WritingScoreModalProps {
  isOpen: boolean
  onClose: () => void
  writingScore: WritingScore
  documentText: string
}

interface CategoryDetails {
  grammar: { description: string; improvements: string[] }
  clarity: { description: string; improvements: string[] }
  engagement: { description: string; improvements: string[] }
  delivery: { description: string; improvements: string[] }
  cohesiveness: { description: string; improvements: string[] }
}

const defaultCategoryDescriptions = {
  grammar: "Evaluates spelling, punctuation, and grammatical correctness throughout your document.",
  clarity: "Measures how clearly your ideas are expressed and how easy they are to understand.",
  engagement: "Assesses how captivating and interesting your writing is to readers.",
  delivery: "Examines the tone, flow, and readability of your ideas as they progress through the text.",
  cohesiveness: "Checks if your content is consistent, logical, and doesn't jump between unrelated topics."
}

export function WritingScoreModal({ isOpen, onClose, writingScore, documentText }: WritingScoreModalProps) {
  const [loading, setLoading] = useState(false)
  const [categoryDetails, setCategoryDetails] = useState<CategoryDetails | null>(null)
  const [error, setError] = useState<string | null>(null)

  const openaiApiKey = import.meta.env.VITE_OPENAI_API_KEY as string | undefined

  useEffect(() => {
    if (isOpen && !categoryDetails && openaiApiKey && documentText) {
      generateImprovementSuggestions()
    }
  }, [isOpen])

  const generateImprovementSuggestions = async () => {
    if (!openaiApiKey || !documentText) {
      setError("Unable to generate suggestions")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const prompt = `Based on these writing scores and the text below, provide specific, actionable improvement suggestions for each category.

Scores:
- Grammar: ${writingScore.breakdown.grammar}%
- Clarity: ${writingScore.breakdown.clarity}%
- Engagement: ${writingScore.breakdown.engagement}%
- Delivery: ${writingScore.breakdown.delivery}%
- Cohesiveness: ${writingScore.breakdown.cohesiveness}%

Text: "${documentText.substring(0, 2000)}${documentText.length > 2000 ? '...' : ''}"

For each category, provide 2-3 specific, actionable improvements. Focus especially on categories with lower scores.

Return ONLY a JSON object in this exact format:
{
  "grammar": { "improvements": ["suggestion1", "suggestion2", "suggestion3"] },
  "clarity": { "improvements": ["suggestion1", "suggestion2", "suggestion3"] },
  "engagement": { "improvements": ["suggestion1", "suggestion2", "suggestion3"] },
  "delivery": { "improvements": ["suggestion1", "suggestion2", "suggestion3"] },
  "cohesiveness": { "improvements": ["suggestion1", "suggestion2", "suggestion3"] }
}`

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiApiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{
            role: 'user',
            content: prompt
          }],
          temperature: 0.4
        })
      })

      if (!response.ok) {
        throw new Error('Failed to get improvement suggestions')
      }

      const data = await response.json()
      const suggestions = JSON.parse(data.choices[0].message.content)

      // Combine with default descriptions
      const details: CategoryDetails = {
        grammar: {
          description: defaultCategoryDescriptions.grammar,
          improvements: suggestions.grammar?.improvements || []
        },
        clarity: {
          description: defaultCategoryDescriptions.clarity,
          improvements: suggestions.clarity?.improvements || []
        },
        engagement: {
          description: defaultCategoryDescriptions.engagement,
          improvements: suggestions.engagement?.improvements || []
        },
        delivery: {
          description: defaultCategoryDescriptions.delivery,
          improvements: suggestions.delivery?.improvements || []
        },
        cohesiveness: {
          description: defaultCategoryDescriptions.cohesiveness,
          improvements: suggestions.cohesiveness?.improvements || []
        }
      }

      setCategoryDetails(details)
    } catch (err) {
      console.error('Error generating improvement suggestions:', err)
      setError('Failed to generate improvement suggestions')
    } finally {
      setLoading(false)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600'
    if (score >= 70) return 'text-blue-600'
    if (score >= 50) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreBgColor = (score: number) => {
    if (score >= 90) return 'bg-green-50'
    if (score >= 70) return 'bg-blue-50'
    if (score >= 50) return 'bg-yellow-50'
    return 'bg-red-50'
  }

  const categories = ['grammar', 'clarity', 'engagement', 'delivery', 'cohesiveness'] as const

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Writing Score Details">
      <div className="space-y-4">
        {/* Overall Score */}
        <div className="text-center pb-4 border-b border-gray-200">
          <div className="text-4xl font-bold mb-1">
            <span className={getScoreColor(writingScore.overall)}>{writingScore.overall}%</span>
          </div>
          <p className="text-gray-600 text-sm">Overall Writing Score</p>
          {writingScore.feedback && (
            <p className="mt-2 text-xs text-gray-700 italic">{writingScore.feedback}</p>
          )}
        </div>

        {/* Category Scores - Two Column Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {categories.map((category) => {
            const score = writingScore.breakdown[category]
            const details = categoryDetails?.[category]
            
            return (
              <div key={category} className={`rounded-lg p-4 ${getScoreBgColor(score)}`}>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 capitalize">{category}</h3>
                    <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">
                      {defaultCategoryDescriptions[category]}
                    </p>
                  </div>
                  <span className={`text-xl font-bold ${getScoreColor(score)} ml-2`}>
                    {score}%
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-1.5 mb-2">
                  <div
                    className={`h-1.5 rounded-full transition-all duration-500 ${
                      score >= 90 ? 'bg-green-500' :
                      score >= 70 ? 'bg-blue-500' :
                      score >= 50 ? 'bg-yellow-500' :
                      'bg-red-500'
                    }`}
                    style={{ width: `${score}%` }}
                  />
                </div>

                {/* Improvement Suggestions */}
                {loading && !details && (
                  <div className="flex items-center justify-center py-3">
                    <LoadingSpinner size="sm" />
                  </div>
                )}

                {details && details.improvements.length > 0 && (
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center gap-1 text-xs font-medium text-gray-700">
                      <TrendingUpIcon className="w-3 h-3" />
                      <span>How to improve:</span>
                    </div>
                    <ul className="space-y-0.5">
                      {details.improvements.slice(0, 2).map((improvement, idx) => (
                        <li key={idx} className="text-xs text-gray-600 flex items-start">
                          <span className="text-gray-400 mr-1.5">•</span>
                          <span className="line-clamp-2">{improvement}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-3 bg-red-50 rounded-lg flex items-start gap-2">
            <InfoIcon className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-red-800">{error}</p>
              <p className="text-xs text-red-600 mt-0.5">
                Improvement suggestions are currently unavailable.
              </p>
            </div>
          </div>
        )}

        {/* Last Calculated */}
        <div className="text-center text-xs text-gray-500 pt-3 border-t border-gray-200">
          Last calculated: {new Date(writingScore.lastCalculated).toLocaleString()}
        </div>
      </div>
    </Modal>
  )
} 