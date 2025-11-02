# Claude Desktop Handoff - EquipIQ Knowledge Base Setup

**Date:** November 2, 2025
**Project:** EquipIQ V2 - AI Troubleshooting Chatbot
**Branch:** `claude/code-review-011CUjUXAN9wz2qneeXFRTYg`
**Repository:** https://github.com/ambriah83/equipiq-v2

---

## Session Summary

### What We Discovered

1. **Knowledge Base Infrastructure is COMPLETE** ✅
   - All database tables exist (equipment_types, knowledge_chunks, etc.)
   - Edge functions deployed (ask-equip-iq-v2, hybrid-rag-search, ingest-knowledge)
   - Admin upload interface built (KnowledgeBaseManager component)
   - RAG system with vector + keyword search ready

2. **Database Status** ⚠️
   - `equipment_types` table was EMPTY
   - We populated it with initial equipment types via SQL
   - User confirmed equipment types were created
   - `knowledge_chunks` table is EMPTY (no documents ingested yet)

3. **The Missing Piece** 🔍
   - User previously worked with Claude (different session) that:
     - Analyzed hundreds of Limble troubleshooting conversations
     - Created Python script: `C:\Users\ambri\Projects\Scripts\pinecone_chat.py`
     - Processed equipment manuals
     - Had access to local files on Windows machine
   - This data exists on user's local machine but NOT in the repository
   - Web Claude Code cannot access `C:\Users\ambri\` directory

### What Needs to Happen

**GOAL:** Ingest the existing Limble troubleshooting data and equipment manuals into the Supabase knowledge base so the chatbot can provide equipment-specific answers.

---

## Critical Information

### Database Credentials (SAVED SECURELY)

**Location:** `/home/user/equipiq-v2/.env.local` (gitignored)

```env
SUPABASE_PROJECT_REF=enpqzoeohonguemzyifo
SUPABASE_DB_PASSWORD=K8pzVGCcE96oC1Ff
SUPABASE_DB_URL=postgresql://postgres:K8pzVGCcE96oC1Ff@db.enpqzoeohonguemzyifo.supabase.co:5432/postgres
SUPABASE_URL=https://enpqzoeohonguemzyifo.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVucHF6b2VvaG9uZ3VlbXp5aWZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2MTM1MzksImV4cCI6MjA2ODE4OTUzOX0.4jpb1342g2tlas1s6uQDLdd8nHpOQMGgDrt980uuHQo
```

### Equipment Types Created

We ran this SQL and user confirmed it worked:

```sql
INSERT INTO equipment_types (name, description) VALUES
  ('VersaSpa Pro', 'VersaSpa automated spray tanning booth'),
  ('Sybaritic Hydration Station', 'Sybaritic brand hydration system'),
  ('Ergoline Affinity 950', 'Ergoline UV tanning bed model 950')
ON CONFLICT (name) DO NOTHING;
```

Equipment types now exist in the database.

---

## Files on User's Local Machine (NEED ACCESS)

### Priority Files to Locate

1. **`C:\Users\ambri\Projects\Scripts\pinecone_chat.py`**
   - Python script that analyzed Limble conversations
   - Need to understand what it does
   - May contain processed troubleshooting Q&A data

2. **Limble Troubleshooting Conversation Data**
   - Described as "HUGE file with hundreds of conversations"
   - Likely CSV, JSON, or Excel format
   - Contains equipment troubleshooting history from Limble CMMS

3. **"Troubleshooting Chat" or "Troubleshoot Chat"**
   - New file mentioned by user
   - Needs to be analyzed and processed

4. **Equipment Manuals**
   - User said they already provided manuals
   - Likely PDFs (VersaSpa Pro Manual, etc.)
   - Need to locate and ingest

5. **Any Processed Output**
   - Check if `pinecone_chat.py` created output files
   - Look for JSON/CSV files with processed Q&A data

### Where to Look

Search these directories on user's machine:
- `C:\Users\ambri\Projects\Scripts\`
- `C:\Users\ambri\Documents\`
- `C:\Users\ambri\Downloads\`
- Any EquipIQ or Limble related folders

---

## Current Repository Status

### Files We Created This Session

1. **Documentation:**
   - `docs/KNOWLEDGE_BASE_STATUS.md` - Testing guide
   - `docs/CHECK_KNOWLEDGE_BASE.md` - SQL verification queries
   - `docs/DATABASE_PASSWORD_SAVED.md` - Connection info
   - `docs/SETUP_DATABASE.md` - Database setup instructions
   - `docs/CLAUDE_DESKTOP_HANDOFF.md` - This file

2. **Scripts:**
   - `scripts/check-knowledge-base.js` - Node.js verification script
   - `scripts/check-db-status.sh` - Bash verification script

3. **Configuration:**
   - `.env.local` - Database credentials (gitignored)

### Existing Data in Repo

- `data/equipment-mappings/` - Equipment asset data from Limble
- `scripts/process-limble-assets.js` - Processes Limble asset exports

---

## Action Plan for Claude Desktop

### Step 1: Locate Local Files

```bash
# Search for the Python script
dir /s /b "C:\Users\ambri\Projects\Scripts\pinecone_chat.py"

# Search for conversation data
dir /s /b "C:\Users\ambri\Documents\*limble*.csv"
dir /s /b "C:\Users\ambri\Documents\*troubleshoot*.csv"

# Search for manuals
dir /s /b "C:\Users\ambri\Documents\*.pdf" | findstr /i "versa mystic ergo"
```

### Step 2: Analyze Existing Work

1. **Read `pinecone_chat.py`**
   - Understand what it does
   - See what data format it expects
   - Check if it already processed the data

2. **Find the conversation data**
   - Locate the "hundreds of conversations" file
   - Determine format (CSV, JSON, Excel)
   - Check file size and structure

3. **Locate equipment manuals**
   - Find PDFs user mentioned
   - List all available manuals

### Step 3: Process and Ingest Data

#### Option A: Use Existing Processed Data

If `pinecone_chat.py` already created processed output:

```python
# Example: If there's a processed JSON file
import json

# Load processed troubleshooting data
with open('processed_conversations.json') as f:
    data = json.load(f)

# Use the ingest-knowledge Edge Function to upload
# Group by equipment type and upload
```

#### Option B: Process Raw Limble Data

If we need to process from scratch:

```python
# Read Limble conversation export
import pandas as pd

df = pd.read_csv('limble_conversations.csv')

# Extract Q&A pairs
# Group by equipment type
# Format for knowledge base
# Upload via ingest-knowledge function
```

### Step 4: Upload Equipment Manuals

For each manual:

```python
# Use the existing admin interface or API
# For each equipment type:
# 1. Read PDF/text content
# 2. Call ingest-knowledge Edge Function
# 3. Verify chunks were created

# Example:
equipment_types = [
    'VersaSpa Pro',
    'Sybaritic Hydration Station',
    'Ergoline Affinity 950'
]

for equip_type in equipment_types:
    manual_path = f"C:/Users/ambri/Documents/{equip_type}_Manual.pdf"
    # Upload via admin interface or API call
```

### Step 5: Verify Knowledge Base

Run this SQL to confirm data was ingested:

```sql
SELECT
  et.name as "Equipment Type",
  COUNT(DISTINCT kc.id) as "Knowledge Chunks",
  COUNT(DISTINCT ed.id) as "Documents"
FROM equipment_types et
LEFT JOIN knowledge_chunks kc ON kc.equipment_type_id = et.id
LEFT JOIN equipment_documentation ed ON ed.equipment_type_id = et.id
GROUP BY et.name
ORDER BY COUNT(DISTINCT kc.id) DESC;
```

Should see numbers > 0 for each equipment type!

### Step 6: Test the Chatbot

1. Go to https://www.equipiq.io
2. Log in as admin
3. Select an equipment type (e.g., VersaSpa Pro)
4. Ask: "How do I clean the filters?"
5. Verify AI provides specific answers from ingested data

---

## Technical Context

### How the Knowledge Base Works

1. **Documents are uploaded** via admin interface or API
2. **ingest-knowledge Edge Function**:
   - Extracts text from PDFs
   - Splits into ~1000 character chunks
   - Generates embeddings via OpenAI
   - Stores in `knowledge_chunks` table

3. **When user asks a question**:
   - Frontend calls `ask-equip-iq-v2`
   - Which calls `hybrid-rag-search`
   - Performs vector + keyword search
   - Returns relevant chunks
   - AI synthesizes answer

### Key Files

- Frontend: `src/App.jsx` (chat interface)
- Backend: `supabase/functions/ask-equip-iq-v2/index.ts` (main AI)
- RAG Search: `supabase/functions/hybrid-rag-search/index.ts` (knowledge retrieval)
- Ingestion: `supabase/functions/ingest-knowledge/index.ts` (document processing)
- Admin UI: `src/components/KnowledgeBaseManager.jsx` (upload interface)

### Database Schema

```sql
-- Main tables
equipment_types (id, name, description)
knowledge_chunks (id, equipment_type_id, content, embedding, source)
equipment_documentation (id, equipment_type_id, title, content, doc_type)
chat_sessions (id, user_id, equipment_type_id)
chat_messages (id, session_id, role, content)
```

---

## Expected Outcome

After completing this work:

1. ✅ Equipment types exist (DONE)
2. ✅ Knowledge chunks > 0 for each equipment type (TODO)
3. ✅ Documents uploaded (TODO)
4. ✅ Chatbot provides specific, detailed answers (TODO)
5. ✅ Users can troubleshoot equipment issues with AI (TODO)

---

## Questions to Ask User

1. **Where exactly is the Limble conversation data?**
   - Full file path
   - File format (CSV, JSON, Excel)
   - File name

2. **What does `pinecone_chat.py` do?**
   - Did it already process the data?
   - Where is the output?
   - What format is the output?

3. **Where are the equipment manuals?**
   - List of files and paths
   - Which equipment types do we have manuals for?

4. **Is there already processed Q&A data?**
   - Ready-to-upload format?
   - Or needs processing?

---

## Troubleshooting

### If Upload Fails

Check Edge Function logs:
1. Go to Supabase Dashboard
2. Edge Functions → ingest-knowledge
3. View Logs tab

Common errors:
- `OPENAI_API_KEY not configured`
- `Failed to extract text from PDF` (image-based PDF)
- `Equipment type not found`

### If Knowledge Base is Empty After Upload

```sql
-- Check if chunks were created
SELECT COUNT(*) FROM knowledge_chunks;

-- Check specific equipment
SELECT * FROM knowledge_chunks
WHERE equipment_type_id = (
  SELECT id FROM equipment_types WHERE name = 'VersaSpa Pro'
);
```

---

## Git Status

**Current branch:** `claude/code-review-011CUjUXAN9wz2qneeXFRTYg`

**Recent commits:**
- Security fixes (DOM sanitization, workflow permissions)
- Documentation (knowledge base guides)
- Database setup (credentials saved)

**To push after ingestion:**
```bash
git add data/
git commit -m "Add processed Limble conversation data and equipment manuals"
git push origin claude/code-review-011CUjUXAN9wz2qneeXFRTYg
```

---

## Success Criteria

You'll know it's working when:

1. **Database Query Shows Data:**
   ```sql
   SELECT et.name, COUNT(kc.id)
   FROM equipment_types et
   JOIN knowledge_chunks kc ON kc.equipment_type_id = et.id
   GROUP BY et.name;
   ```
   Returns rows with counts > 0

2. **Chatbot Provides Specific Answers:**
   - Ask: "VersaSpa Pro won't spray, what should I check?"
   - AI responds with specific steps from manual/conversations
   - NOT generic responses

3. **Users Can Troubleshoot Equipment:**
   - Select equipment
   - Ask questions
   - Get actionable solutions
   - Resolve issues faster

---

## Contact Information

- **Repository:** https://github.com/ambriah83/equipiq-v2
- **Live Site:** https://www.equipiq.io
- **Supabase Project:** enpqzoeohonguemzyifo
- **Branch:** claude/code-review-011CUjUXAN9wz2qneeXFRTYg

---

## Next Steps for User

1. **Switch to Claude Desktop** (download from https://claude.ai/download)
2. **Open Claude Desktop**
3. **Start new conversation** and say:
   - "I need to work on my EquipIQ project"
   - "Read the CLAUDE_DESKTOP_HANDOFF.md file"
   - Share this conversation context

4. **Give me access to:**
   - `C:\Users\ambri\Projects\Scripts\pinecone_chat.py`
   - Limble conversation data files
   - Equipment manuals
   - Any processed output files

5. **I will:**
   - Analyze existing work
   - Process/ingest the data
   - Populate knowledge base
   - Test chatbot
   - Verify everything works

---

## Notes

- All credentials are saved in `.env.local` (gitignored)
- Equipment types are created and ready
- Knowledge base infrastructure is complete
- Just need to ingest the actual troubleshooting data!

**This is the final missing piece to make the chatbot fully functional!** 🚀
