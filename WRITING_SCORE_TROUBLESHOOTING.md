# Writing Score Feature - Troubleshooting Guide

## Why is my writing score showing 0% or "-"?

### Common Reasons:

1. **No scores calculated yet**: Writing scores are only calculated when documents are saved. Existing documents created before this feature won't have scores until they're edited and saved.

2. **No OpenAI API key**: Check that your `.env.local` file contains:
   ```
   VITE_OPENAI_API_KEY=your-api-key-here
   ```

3. **Text too short**: Documents need at least 50 characters to be scored.

## How to Fix:

### Option 1: Wait for Automatic Calculation
- Scores are calculated automatically when you visit the Dashboard
- Look for "Calculating..." text under the Writing Score stat
- This process happens automatically for all documents without scores

### Option 2: Edit and Save Documents
- Open a document in the editor
- Make any small change (even just adding a space)
- Save the document (Ctrl+S or wait for auto-save)
- The score will be calculated automatically

### Option 3: Check the Console
- Open browser developer tools (F12)
- Check the Console tab for any error messages
- Common errors:
  - "OpenAI API key is not set!" - Add your API key to `.env.local`
  - "Text too short for analysis" - Document needs more content

## How Scores Work:

- **Overall Score**: Average of 4 categories (0-100)
- **Grammar**: Spelling and grammar correctness
- **Clarity**: How clear and concise the writing is
- **Engagement**: How engaging and vivid the writing is
- **Structure**: Organization and paragraph structure

## Score Colors:
- 🟢 Green (90-100): Excellent
- 🔵 Blue (70-89): Good
- 🟡 Yellow (50-69): Needs improvement
- 🔴 Red (0-49): Poor

## Tips:
- Hover over any score badge to see the detailed breakdown
- Scores are calculated using OpenAI's GPT-4 model
- If OpenAI is unavailable, a basic fallback scoring is used
- Scores are cached and won't recalculate unless the document changes
- **Important**: Scores are stored in memory only and will be lost if you refresh the page 