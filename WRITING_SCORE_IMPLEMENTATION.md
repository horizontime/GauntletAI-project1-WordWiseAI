# Writing Score Feature - Simple AI Implementation

## Overview
A basic AI-powered writing score feature that replaces the hardcoded scores in the dashboard and editor. This implementation uses OpenAI to analyze writing quality and provides a score from 0-100.

## Implementation Tasks (1 Day)

### 1. Create Types (30 minutes)
- [ ] Create `src/types/writingScore.ts`:
```typescript
export interface WritingScore {
  overall: number; // 0-100
  breakdown: {
    grammar: number;
    clarity: number;
    engagement: number;
    structure: number;
  };
  feedback: string;
  lastCalculated: Date;
}
```

### 2. Create Writing Score Service (2 hours)
- [ ] Create `src/lib/writingScoreService.ts`:
  - [ ] Function to calculate basic metrics (word count, sentence count, paragraph count)
  - [ ] Function to call OpenAI API for AI analysis
  - [ ] Function to combine basic metrics + AI analysis into final score

```typescript
// Example structure:
export async function calculateWritingScore(text: string): Promise<WritingScore> {
  // 1. Calculate basic metrics
  const basicMetrics = getBasicMetrics(text);
  
  // 2. Get AI analysis from OpenAI
  const aiAnalysis = await getAIAnalysis(text);
  
  // 3. Combine into final score
  return combineScores(basicMetrics, aiAnalysis);
}
```

### 3. OpenAI Integration (1.5 hours)
- [ ] Add OpenAI prompt for analyzing text quality:
```typescript
const prompt = `
Analyze this student text and rate it on a scale of 0-100 for each category:
1. Grammar and Spelling (0-100)
2. Clarity and Coherence (0-100)
3. Engagement and Style (0-100)
4. Structure and Organization (0-100)

Also provide one sentence of constructive feedback.

Text: "${text}"

Return as JSON: { grammar: number, clarity: number, engagement: number, structure: number, feedback: string }
`;
```

- [ ] Use existing `VITE_OPENAI_API_KEY` from environment
- [ ] Handle API errors gracefully (fallback to basic scoring)

### 4. Update Document Store (1 hour)
- [ ] Add to `src/stores/documentStore.ts`:
  - [ ] Add `writingScore?: WritingScore` to document type
  - [ ] Add function `calculateDocumentScore(documentId: string)`
  - [ ] Auto-calculate score when document is saved

### 5. Update Editor Page (1.5 hours)
- [ ] In `src/pages/EditorPage.tsx`:
  - [ ] Replace hardcoded "85%" with actual score
  - [ ] Add loading state while score is calculating
  - [ ] Show score breakdown on hover (tooltip)
  - [ ] Update score after auto-save completes

```typescript
// Replace this line:
<span>Writing Score: 85%</span>

// With:
<span>
  Writing Score: {currentDocument?.writingScore?.overall || 0}%
  {scoreLoading && <LoadingSpinner size="sm" />}
</span>
```

### 6. Update Dashboard Page (1.5 hours)
- [ ] In `src/pages/DashboardPage.tsx`:
  - [ ] Calculate average score from all documents
  - [ ] Replace hardcoded "94%" with actual average
  - [ ] Show individual document scores in cards
  - [ ] Add score badge with color coding:
    - 90-100: Green
    - 70-89: Blue
    - 50-69: Yellow
    - 0-49: Red

### 7. Add Visual Feedback (1 hour)
- [ ] Create simple score badge component `src/components/ScoreBadge.tsx`
- [ ] Add score trend arrow (↑↓) if score changed from last calculation
- [ ] Add tooltip to show score breakdown on hover

## Code Examples

### WritingScoreService.ts Basic Structure
```typescript
import { WritingScore } from '../types/writingScore';

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

export async function calculateWritingScore(text: string): Promise<WritingScore> {
  if (!text || text.trim().length < 50) {
    return {
      overall: 0,
      breakdown: { grammar: 0, clarity: 0, engagement: 0, structure: 0 },
      feedback: "Text too short to analyze",
      lastCalculated: new Date()
    };
  }

  try {
    // Get AI analysis
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{
          role: 'user',
          content: `[AI prompt here]`
        }],
        temperature: 0.3
      })
    });

    const data = await response.json();
    const aiResult = JSON.parse(data.choices[0].message.content);
    
    // Calculate overall score
    const overall = Math.round(
      (aiResult.grammar + aiResult.clarity + aiResult.engagement + aiResult.structure) / 4
    );

    return {
      overall,
      breakdown: aiResult,
      feedback: aiResult.feedback,
      lastCalculated: new Date()
    };
  } catch (error) {
    // Fallback to basic scoring
    return getBasicScore(text);
  }
}

function getBasicScore(text: string): WritingScore {
  // Simple fallback scoring based on text length, sentence variety, etc.
  const wordCount = text.split(/\s+/).length;
  const sentenceCount = text.split(/[.!?]/).length - 1;
  const avgWordsPerSentence = wordCount / sentenceCount;
  
  // Basic scoring logic
  const score = Math.min(100, Math.max(0, 
    50 + 
    (wordCount > 100 ? 10 : 0) +
    (avgWordsPerSentence < 25 ? 10 : -5) +
    (text.includes('\n\n') ? 10 : 0) // Has paragraphs
  ));

  return {
    overall: score,
    breakdown: {
      grammar: score,
      clarity: score,
      engagement: score,
      structure: score
    },
    feedback: "AI analysis unavailable. Showing basic score.",
    lastCalculated: new Date()
  };
}
```

### Integration Points

1. **EditorPage.tsx** - Update the status bar:
```typescript
// Add to component state
const [scoreLoading, setScoreLoading] = useState(false);

// Add score calculation trigger
useEffect(() => {
  if (hasUnsavedChanges) return;
  
  const calculateScore = async () => {
    if (!currentDocument?.content) return;
    setScoreLoading(true);
    const score = await calculateWritingScore(editor.getText());
    // Update document with new score
    await updateDocumentScore(currentDocument.id, score);
    setScoreLoading(false);
  };
  
  calculateScore();
}, [hasUnsavedChanges]); // Recalculate when document is saved
```

2. **DashboardPage.tsx** - Show average score:
```typescript
// Calculate average score
const averageScore = documents.reduce((acc, doc) => {
  return acc + (doc.writingScore?.overall || 0);
}, 0) / documents.length || 0;

// Replace "94%" with:
<p className="text-3xl font-bold text-gray-900">{Math.round(averageScore)}%</p>
```

## Estimated Timeline
- **Morning (4 hours)**: 
  - Types, service creation, OpenAI integration
  - Basic score calculation working
  
- **Afternoon (4 hours)**:
  - UI integration in Editor and Dashboard
  - Visual feedback (badges, colors)
  - Testing and bug fixes

## Notes
- No database changes needed (scores stored in existing document records)
- No caching (recalculate on each save)
- Simple error handling (fallback to basic scoring)
- No progress tracking or historical data
- No advanced UI components (just tooltips and badges) 