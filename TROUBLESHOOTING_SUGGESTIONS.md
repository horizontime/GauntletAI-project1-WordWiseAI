# Troubleshooting Guide: Suggestions Applied Feature

## Debugging Steps

### 1. Check Browser Console
Open your browser's Developer Tools (F12) and check the Console tab for any error messages when:
- Loading the dashboard
- Accepting a suggestion in the editor

### 2. Verify Database Migration
The most common issue is that the database migration hasn't been run yet.

**Check if the column exists:**
1. Open your browser console on the Dashboard page
2. Look for error messages containing "column suggestions_applied does not exist"
3. If you see this error, you need to run the migration

**To run the migration:**
1. Go to your Supabase dashboard
2. Navigate to SQL Editor
3. Run this SQL:
```sql
ALTER TABLE documents 
ADD COLUMN IF NOT EXISTS suggestions_applied INTEGER DEFAULT 0;

UPDATE documents 
SET suggestions_applied = 0 
WHERE suggestions_applied IS NULL;
```

### 3. Check Console Logs
When accepting a suggestion, you should see minimal logs. If there are errors, they will appear in the console with messages like:
- "Error incrementing suggestions applied: [error details]"
- "IMPORTANT: The suggestions_applied column does not exist in the database."

### 4. Common Issues and Solutions

**Issue: No change in count when accepting suggestions**
- The suggestion acceptance handler might not be triggering
- Check if suggestions are showing up in the sidebar
- Try accepting different types of suggestions (spelling, grammar, AI)

**Issue: "Cannot accept suggestion: editor or currentDocument is missing"**
- The document might not be fully loaded
- Try refreshing the page and waiting a moment before accepting suggestions

**Issue: Database update fails**
- Check your Supabase connection
- Verify your authentication is working
- Check if the document ID is valid

**Issue: Count shows 0 even after accepting suggestions**
- The field might be null in the database
- Run the UPDATE part of the migration again
- Check if the dashboard is fetching the latest data

### 5. Manual Database Check
You can verify the data directly in Supabase:
1. Go to your Supabase dashboard
2. Navigate to Table Editor > documents
3. Check if the `suggestions_applied` column exists
4. Check the values for your documents

## Still Not Working?
If the feature still isn't working after these steps:
1. Check for any TypeScript errors in your editor
2. Make sure you've saved all files
3. Restart your development server
4. Clear your browser cache
5. Check if there are any network errors in the Network tab of Developer Tools 