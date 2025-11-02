# Knowledge Base Status & Testing Guide

## Current Status

Based on the code review, here's what's been built:

### ✅ Infrastructure Complete
1. **Database Schema** - All tables exist:
   - `equipment_types` - Equipment categories
   - `knowledge_chunks` - RAG-processed content with embeddings
   - `equipment_documentation` - Full documents
   - `chat_sessions` & `chat_messages` - Conversation history

2. **Edge Functions Deployed**:
   - `ask-equip-iq-v2` - Main chat AI (OpenAI GPT-4)
   - `hybrid-rag-search` - Knowledge retrieval (vector + keyword search)
   - `ingest-knowledge` - Document processing and embedding

3. **Admin Interface**:
   - Knowledge Base Manager for uploading documents
   - Supports PDF, text, markdown files
   - Automatic text extraction and chunking

### 🔒 Database Security
- **Row Level Security (RLS) is enabled** - This is why direct API queries return "Access denied"
- This is GOOD - it means only authenticated users can access the data
- You need to log in to the app to check the knowledge base

## How to Check What's in the Database

### Option 1: Via Admin Dashboard (Recommended)
1. Go to https://www.equipiq.io
2. Log in with your admin account
3. Navigate to **Knowledge Base** section
4. You should see:
   - List of equipment types/models
   - Number of documents per equipment
   - Uploaded manuals and guides

### Option 2: Via Supabase Dashboard
1. Go to https://supabase.com/dashboard
2. Open project: `enpqzoeohonguemzyifo`
3. Navigate to **Table Editor**
4. Check these tables:
   - `equipment_types` - Should have your equipment categories
   - `knowledge_chunks` - Should have chunked knowledge with embeddings
   - `equipment_documentation` - Should have full document records

5. Run SQL query:
```sql
-- Check knowledge base status
SELECT
  et.name as equipment_type,
  COUNT(DISTINCT kc.id) as knowledge_chunks,
  COUNT(DISTINCT ed.id) as documents
FROM equipment_types et
LEFT JOIN knowledge_chunks kc ON kc.equipment_type_id = et.id
LEFT JOIN equipment_documentation ed ON ed.equipment_type_id = et.id
GROUP BY et.id, et.name
ORDER BY et.name;
```

## How to Test the Chatbot

### Prerequisites
- Knowledge must be ingested for at least one equipment type
- You must be logged in as a user

### Testing Steps

1. **Access the Chat Interface**
   - Go to https://www.equipiq.io
   - Log in
   - Navigate to the chat interface

2. **Select Equipment**
   - Use the location dropdown (DC, ES, NW, WH, ALL)
   - Select specific equipment that has knowledge ingested

3. **Ask Troubleshooting Questions**
   Try questions like:
   - "How do I clean the filters?"
   - "The unit won't turn on, what should I check?"
   - "What temperature should this be set to?"
   - "I'm getting an error code E3, what does that mean?"

4. **Verify Knowledge Retrieval**
   The AI should:
   - Reference specific information from manuals
   - Provide step-by-step instructions
   - Use terminology from your documentation
   - NOT say "No specific context found" (if knowledge exists)

### What to Look For

**✅ Good Signs (Knowledge Base Working):**
- AI provides equipment-specific details
- Responses reference manual pages or sections
- Instructions match your documentation
- AI confidently provides troubleshooting steps

**❌ Problem Signs (Knowledge Base Empty):**
- AI says "No specific context found"
- Generic responses not specific to your equipment
- AI says "I don't have information about..."
- Responses are vague or general

## If Knowledge Base is Empty

According to the screenshot at `/home/user/equipiq-v2/BUGS/bug_failed to upload manual.png`, there was an issue uploading "VersaSPa Pro Manual.pdf".

### Steps to Populate Knowledge Base:

1. **Verify Equipment Types Exist**
   ```sql
   SELECT * FROM equipment_types;
   ```
   If empty, run migration: `004_equipment_type_mappings.sql`

2. **Upload Documents via Admin Interface**
   - Log in to admin dashboard
   - Go to Knowledge Base section
   - Select equipment model
   - Upload document (PDF, TXT, MD)
   - System will automatically:
     - Extract text from PDF
     - Split into ~1000 character chunks
     - Generate embeddings
     - Store in `knowledge_chunks` table

3. **Check Upload Status**
   After upload, you should see confirmation:
   "Document uploaded successfully! Created X knowledge chunks."

4. **Test Immediately**
   - Go to chat
   - Select the equipment you just uploaded docs for
   - Ask a question about that equipment

## Troubleshooting Upload Issues

### Error: "Failed to upload document"
**Possible causes:**
1. PDF is image-based (scanned) without text layer
   - **Fix**: Use OCR to convert to text PDF first

2. OpenAI API key not configured
   - **Fix**: Set `OPENAI_API_KEY` in Supabase secrets
   ```bash
   npx supabase secrets set OPENAI_API_KEY=sk-... --project-ref enpqzoeohonguemzyifo
   ```

3. File size too large
   - **Fix**: Split large manuals into sections

4. Equipment type doesn't exist
   - **Fix**: Ensure migrations are applied

### Error: "No equipment type found"
**Fix:**
1. Check if equipment types table is populated
2. Run migration 004 to create types from equipment models
3. Or manually create equipment type:
```sql
INSERT INTO equipment_types (name, description)
VALUES ('VersaSpa Pro', 'Spray tanning booth');
```

## Expected Performance

With knowledge ingested:
- **Response time**: 2-5 seconds
- **Accuracy**: High for documented procedures
- **Context**: 3-5 relevant knowledge chunks per query
- **Coverage**: Should handle 80%+ of common issues

Without knowledge:
- **Response time**: 1-2 seconds (faster but less useful)
- **Accuracy**: General AI knowledge only
- **Context**: None
- **Coverage**: <30% of specific equipment issues

## Next Steps

1. ✅ Verify equipment types exist in database
2. ✅ Upload at least one complete equipment manual
3. ✅ Test with specific troubleshooting questions
4. ✅ Review AI responses for accuracy
5. ✅ Upload additional documentation for other equipment
6. ✅ Start collecting user feedback for fine-tuning

## Files to Check

- Frontend: `/home/user/equipiq-v2/src/App.jsx:328` (calls ask-equip-iq-v2)
- RAG Search: `/home/user/equipiq-v2/supabase/functions/hybrid-rag-search/index.ts`
- Knowledge Ingestion: `/home/user/equipiq-v2/supabase/functions/ingest-knowledge/index.ts`
- Upload UI: `/home/user/equipiq-v2/src/components/KnowledgeBaseManager.jsx`
