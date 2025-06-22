# Database Migration Instructions

To enable the suggestions tracking feature, you need to add a new column to your Supabase database.

## Steps to Apply Migration

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Run the following SQL script:

```sql
-- Add suggestions_applied column to documents table
ALTER TABLE documents 
ADD COLUMN IF NOT EXISTS suggestions_applied INTEGER DEFAULT 0;

-- Update existing documents to have 0 suggestions applied if NULL
UPDATE documents 
SET suggestions_applied = 0 
WHERE suggestions_applied IS NULL;
```

4. The migration will add a `suggestions_applied` column to track how many suggestions have been applied to each document
5. Existing documents will have this value set to 0

## What This Does

- Adds a `suggestions_applied` field to each document that tracks the total number of writing suggestions that have been accepted
- The dashboard will now display the total count of all suggestions applied across all documents
- Every time a user accepts a suggestion in the editor, the count will increment

## Testing

After applying the migration:
1. Open a document in the editor
2. Accept some suggestions
3. Go back to the dashboard
4. You should see the "Suggestions Applied" stat card showing the actual count instead of the placeholder value 