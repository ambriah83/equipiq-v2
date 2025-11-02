# How to Check Your Knowledge Base Status

Your database has Row Level Security (RLS) enabled, which is excellent for security but means you need to check the database through the Supabase Dashboard.

## Method 1: Supabase Dashboard SQL Editor (RECOMMENDED)

### Step 1: Access SQL Editor
1. Go to https://supabase.com/dashboard
2. Select project: **enpqzoeohonguemzyifo** (equipiq-v2)
3. Click **SQL Editor** in the left sidebar
4. Click **+ New Query**

### Step 2: Run This Query

```sql
-- Complete Knowledge Base Status Report
WITH equipment_stats AS (
  SELECT
    et.id,
    et.name,
    et.description,
    COUNT(DISTINCT kc.id) as chunk_count,
    COUNT(DISTINCT ed.id) as doc_count,
    MAX(kc.created_at) as last_chunk_added,
    MAX(ed.created_at) as last_doc_added
  FROM equipment_types et
  LEFT JOIN knowledge_chunks kc ON kc.equipment_type_id = et.id
  LEFT JOIN equipment_documentation ed ON ed.equipment_type_id = et.id
  GROUP BY et.id, et.name, et.description
)
SELECT
  name as "Equipment Type",
  chunk_count as "Knowledge Chunks",
  doc_count as "Documents",
  CASE
    WHEN chunk_count > 0 THEN '✅ Ready to Test'
    ELSE '⚠️ No Knowledge'
  END as "Status",
  last_chunk_added as "Last Updated"
FROM equipment_stats
ORDER BY chunk_count DESC, name;
```

### Step 3: Interpret Results

**Example Output:**

| Equipment Type | Knowledge Chunks | Documents | Status | Last Updated |
|----------------|------------------|-----------|--------|--------------|
| VersaSpa Pro | 45 | 1 | ✅ Ready to Test | 2025-07-17 |
| Sybaritic Hydration Station | 0 | 0 | ⚠️ No Knowledge | null |

**What this means:**
- ✅ **Ready to Test**: This equipment has knowledge ingested - you can test the chatbot with it
- ⚠️ **No Knowledge**: No documentation uploaded yet - chatbot will use general AI knowledge only

---

## Method 2: Detailed Chunk Analysis

If you want to see what specific content is in the knowledge base:

```sql
-- View sample knowledge chunks
SELECT
  et.name as equipment_type,
  kc.source,
  kc.chunk_type,
  LEFT(kc.content, 100) || '...' as content_preview,
  kc.created_at
FROM knowledge_chunks kc
JOIN equipment_types et ON et.id = kc.equipment_type_id
ORDER BY kc.created_at DESC
LIMIT 10;
```

This shows you the actual content that was ingested.

---

## Method 3: Check Document Upload History

```sql
-- See all uploaded documents
SELECT
  et.name as equipment_type,
  ed.title as document_title,
  ed.doc_type,
  LENGTH(ed.content) as content_length,
  ed.created_at as uploaded_at
FROM equipment_documentation ed
JOIN equipment_types et ON et.id = ed.equipment_type_id
ORDER BY ed.created_at DESC;
```

---

## Method 4: Table Editor (Quick Visual Check)

1. In Supabase Dashboard, click **Table Editor**
2. View these tables:
   - **equipment_types** - Should show your equipment categories
   - **knowledge_chunks** - Should show chunked content (if any uploaded)
   - **equipment_documentation** - Should show full documents (if any uploaded)

---

## What You're Looking For

### ✅ GOOD - Knowledge Base is Ready
```
Equipment Type            | Knowledge Chunks | Documents
VersaSpa Pro             | 45              | 1
Ergoline Affinity 950    | 38              | 1
Sybaritic Hydration      | 52              | 1
```
**Action**: Test the chatbot immediately!

### ⚠️ NEEDS WORK - Knowledge Base is Empty
```
Equipment Type            | Knowledge Chunks | Documents
VersaSpa Pro             | 0               | 0
Ergoline Affinity 950    | 0               | 0
Sybaritic Hydration      | 0               | 0
```
**Action**: Upload documentation via admin dashboard

---

## Common Scenarios

### Scenario 1: Equipment Types Exist, But No Chunks
**Diagnosis**: Migrations ran successfully, but no documents uploaded yet

**Fix**:
1. Log into https://www.equipiq.io as admin
2. Go to **Knowledge Base** section
3. Select an equipment type
4. Upload a manual or troubleshooting guide

### Scenario 2: No Equipment Types Found
**Diagnosis**: Migration 004 hasn't been applied

**Fix**:
```sql
-- Manually create an equipment type
INSERT INTO equipment_types (name, description)
VALUES
  ('VersaSpa Pro', 'VersaSpa spray tanning booth'),
  ('Sybaritic Hydration Station', 'Sybaritic brand hydration system');
```

Then upload documents via the admin dashboard.

### Scenario 3: Documents Exist But Zero Chunks
**Diagnosis**: Document upload succeeded but chunking/embedding failed

**Check Logs**:
1. In Supabase Dashboard → **Edge Functions**
2. Click **ingest-knowledge**
3. View **Logs** tab
4. Look for errors during upload

**Common Errors**:
- `OPENAI_API_KEY not configured` - API key missing
- `Failed to extract text from PDF` - PDF is image-based (needs OCR)
- `Failed to generate embedding` - OpenAI API error

---

## Testing After Verification

### If Knowledge Chunks > 0 ✅

**Test with Equipment-Specific Questions:**

1. Go to https://www.equipiq.io
2. Log in
3. Select an equipment that has knowledge (from your query results)
4. Ask specific questions:
   - "How do I clean the filters?"
   - "What should I do if I see error code E3?"
   - "The unit won't heat up, what should I check?"
   - "What's the maintenance schedule?"

**Expected Behavior:**
- AI should provide specific, detailed answers
- Responses should reference your documentation
- Should NOT say "No specific context found"

### If Knowledge Chunks = 0 ⚠️

**The AI will still respond, but:**
- Answers will be generic/general
- Won't reference your specific equipment
- Will say "No specific context found" in the logs
- Accuracy will be lower

**Next Step**: Upload documentation!

---

## Quick Commands Reference

```sql
-- Total knowledge chunks
SELECT COUNT(*) FROM knowledge_chunks;

-- Knowledge by equipment
SELECT et.name, COUNT(kc.id)
FROM equipment_types et
LEFT JOIN knowledge_chunks kc ON kc.equipment_type_id = et.id
GROUP BY et.name;

-- Recent uploads
SELECT * FROM knowledge_chunks
ORDER BY created_at DESC
LIMIT 5;

-- Check specific equipment
SELECT * FROM knowledge_chunks
WHERE equipment_type_id = 'YOUR-UUID-HERE';
```

---

## Next Steps Based on Results

1. **Run the main query** (Method 1)
2. **Screenshot the results**
3. **Share with me** so I can help with:
   - Testing specific equipment
   - Troubleshooting upload issues
   - Improving knowledge coverage
   - Creating test scenarios

---

## Security Note

✅ The "Access denied" errors I encountered are **GOOD** - they mean your RLS policies are working correctly and protecting your data. Only authenticated users and the service role can access the knowledge base.
