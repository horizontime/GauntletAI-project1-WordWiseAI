import { useState } from 'react'
import { WritingScore } from '../types/writingScore'

interface ScoreBadgeProps {
  score: number
  writingScore?: WritingScore
  size?: 'sm' | 'md' | 'lg'
  showTrend?: boolean
  previousScore?: number
  onClick?: () => void
  clickable?: boolean
}

export function ScoreBadge({ score, writingScore, size = 'md', showTrend = false, previousScore, onClick, clickable }: ScoreBadgeProps) {
  const [showTooltip, setShowTooltip] = useState(false)

  // Determine color based on score
  const getScoreColor = (scoreValue: number) => {
    if (scoreValue >= 90) return 'text-green-700 bg-green-100 border-green-200'
    if (scoreValue >= 70) return 'text-blue-700 bg-blue-100 border-blue-200'
    if (scoreValue >= 50) return 'text-yellow-700 bg-yellow-100 border-yellow-200'
    return 'text-red-700 bg-red-100 border-red-200'
  }

  // Determine size classes
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'text-xs px-2 py-0.5'
      case 'lg':
        return 'text-base px-3 py-1.5'
      default:
        return 'text-sm px-2.5 py-1'
    }
  }

  // Calculate trend
  const trend = previousScore !== undefined ? score - previousScore : 0
  const trendIcon = trend > 0 ? '↑' : trend < 0 ? '↓' : ''

  return (
    <div className="relative inline-block">
      <div
        className={`inline-flex items-center gap-1 rounded-full font-medium border ${getScoreColor(score)} ${getSizeClasses()} ${
          clickable ? 'cursor-pointer hover:opacity-80 transition-opacity' : 'cursor-default'
        }`}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onClick={clickable ? onClick : undefined}
      >
        <span>{score}%</span>
        {showTrend && trendIcon && (
          <span className={trend > 0 ? 'text-green-600' : 'text-red-600'}>
            {trendIcon}
          </span>
        )}
      </div>

      {/* Tooltip */}
      {showTooltip && writingScore && (
        <div className="absolute z-10 bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 p-3 bg-gray-900 text-white text-sm rounded-lg shadow-lg">
          <div className="space-y-2">
            <div className="font-medium">Score Breakdown</div>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span>Grammar:</span>
                <span>{writingScore.breakdown.grammar}%</span>
              </div>
              <div className="flex justify-between">
                <span>Clarity:</span>
                <span>{writingScore.breakdown.clarity}%</span>
              </div>
              <div className="flex justify-between">
                <span>Engagement:</span>
                <span>{writingScore.breakdown.engagement}%</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery:</span>
                <span>{writingScore.breakdown.delivery}%</span>
              </div>
              <div className="flex justify-between">
                <span>Cohesiveness:</span>
                <span>{writingScore.breakdown.cohesiveness}%</span>
              </div>
            </div>
            {writingScore.feedback && (
              <div className="pt-2 border-t border-gray-700 text-xs italic">
                {writingScore.feedback}
              </div>
            )}
          </div>
          {/* Tooltip arrow */}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
            <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-gray-900"></div>
          </div>
        </div>
      )}
    </div>
  )
} 