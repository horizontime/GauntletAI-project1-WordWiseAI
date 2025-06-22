import { WritingScore } from '../types/writingScore';

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

// Note: Writing scores are stored in memory only, not persisted to the database.
// This keeps the feature simple and avoids database schema changes.

export async function calculateWritingScore(text: string): Promise<WritingScore> {
  if (!text || text.trim().length < 50) {
    console.log('Text too short for analysis:', text.length)
    return {
      overall: 0,
      breakdown: { grammar: 0, clarity: 0, engagement: 0, structure: 0 },
      feedback: "Text too short to analyze",
      lastCalculated: new Date()
    };
  }

  if (!OPENAI_API_KEY) {
    console.error('OpenAI API key is not set!')
    return getBasicScore(text)
  }

  console.log('Calculating writing score for text of length:', text.length)

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
          content: `Analyze this student text and rate it on a scale of 0-100 for each category:
1. Grammar and Spelling (0-100)
2. Clarity and Coherence (0-100)
3. Engagement and Style (0-100)
4. Structure and Organization (0-100)

Also provide one sentence of constructive feedback for the student.

Text: "${text}"

Return ONLY a JSON object in this exact format:
{ "grammar": number, "clarity": number, "engagement": number, "structure": number, "feedback": "string" }`
        }],
        temperature: 0.3
      })
    });

    if (!response.ok) {
      throw new Error('OpenAI API request failed');
    }

    const data = await response.json();
    const aiResult = JSON.parse(data.choices[0].message.content);
    
    // Calculate overall score
    const overall = Math.round(
      (aiResult.grammar + aiResult.clarity + aiResult.engagement + aiResult.structure) / 4
    );

    return {
      overall,
      breakdown: {
        grammar: aiResult.grammar,
        clarity: aiResult.clarity,
        engagement: aiResult.engagement,
        structure: aiResult.structure
      },
      feedback: aiResult.feedback,
      lastCalculated: new Date()
    };
  } catch (error) {
    console.error('Error calculating writing score:', error);
    // Fallback to basic scoring
    return getBasicScore(text);
  }
}

function getBasicScore(text: string): WritingScore {
  // Simple fallback scoring based on text length, sentence variety, etc.
  const wordCount = text.split(/\s+/).filter(word => word.length > 0).length;
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const sentenceCount = sentences.length;
  const avgWordsPerSentence = sentenceCount > 0 ? wordCount / sentenceCount : 0;
  const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 0);
  
  // Basic scoring logic
  let score = 50; // Base score
  
  // Word count bonus
  if (wordCount >= 100) score += 10;
  if (wordCount >= 300) score += 5;
  
  // Sentence variety bonus
  if (avgWordsPerSentence >= 10 && avgWordsPerSentence <= 25) score += 10;
  
  // Paragraph structure bonus
  if (paragraphs.length >= 3) score += 10;
  
  // Has capital letters and punctuation
  if (/[A-Z]/.test(text) && /[.!?]/.test(text)) score += 5;
  
  // Variety of sentence lengths
  const sentenceLengths = sentences.map(s => s.split(/\s+/).length);
  const avgLength = sentenceLengths.reduce((a, b) => a + b, 0) / sentenceLengths.length;
  const variance = sentenceLengths.reduce((sum, len) => sum + Math.pow(len - avgLength, 2), 0) / sentenceLengths.length;
  if (variance > 20) score += 10; // Bonus for varied sentence lengths

  score = Math.min(100, Math.max(0, score));

  return {
    overall: score,
    breakdown: {
      grammar: score,
      clarity: score,
      engagement: score,
      structure: score
    },
    feedback: "AI analysis unavailable. Score based on basic text metrics.",
    lastCalculated: new Date()
  };
} 