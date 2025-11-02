# Database Setup Instructions

## Current Status: Equipment Types Table is Empty ⚠️

Your SQL query returned "No rows" which means the `equipment_types` table exists but has no data in it.

## What Needs to Happen

You have two database schemas that need to be populated:

### Schema 1: Original Schema (equipment_models)
- `equipment_manufacturers`
- `equipment_models`
- `knowledge_documents`

### Schema 2: RAG Schema (equipment_types)
- `equipment_types` ← **THIS IS EMPTY**
- `knowledge_chunks`
- `equipment_documentation`

## Step 1: Check Which Schema Has Data

Run this in Supabase SQL Editor:

```sql
-- Check both schemas
SELECT 'equipment_manufacturers' as table_name, COUNT(*) as count FROM equipment_manufacturers
UNION ALL
SELECT 'equipment_models', COUNT(*) FROM equipment_models
UNION ALL
SELECT 'equipment_types', COUNT(*) FROM equipment_types
UNION ALL
SELECT 'knowledge_documents', COUNT(*) FROM knowledge_documents
UNION ALL
SELECT 'knowledge_chunks', COUNT(*) FROM knowledge_chunks;
```

This will show which tables have data.

## Step 2: Apply Migrations (If Needed)

If ALL tables show 0, the migrations haven't been fully applied.

### Option A: Using Supabase CLI

```bash
cd /home/user/equipiq-v2

# Apply all migrations
npx supabase db push --db-url "postgresql://postgres:K8pzVGCcE96oC1Ff@db.enpqzoeohonguemzyifo.supabase.co:5432/postgres"
```

### Option B: Manually via SQL Editor

Go to Supabase Dashboard SQL Editor and run each migration file in order:

1. `001_equipment_knowledge_base.sql`
2. `20250716_create_rag_schema.sql`
3. `20250716_create_vector_search_function.sql`
4. `002_fine_tuning_system.sql`
5. `003_rbac_functions.sql`
6. `004_equipment_type_mappings.sql` ← **This one populates equipment_types!**

## Step 3: Create Initial Equipment Types

If migrations are applied but `equipment_types` is still empty, manually create them:

```sql
-- Insert initial equipment types
INSERT INTO equipment_types (name, description) VALUES
  ('VersaSpa Pro', 'VersaSpa automated spray tanning booth'),
  ('Mystic Tan', 'Mystic brand spray tanning system'),
  ('Sybaritic Hydration Station', 'Sybaritic brand hydration system'),
  ('Ergoline Affinity 950', 'Ergoline UV tanning bed model 950'),
  ('KBL 8000ES', 'KBL brand tanning bed'),
  ('Red Light Therapy', 'Red light therapy equipment'),
  ('Wellness Pod', 'Cocoon or wellness pod equipment'),
  ('Massage Equipment', 'Massage chairs and tables'),
  ('Sauna', 'Infrared or traditional sauna'),
  ('Cryotherapy', 'Whole body cryotherapy chamber'),
  ('Float Tank', 'Sensory deprivation float tank')
ON CONFLICT (name) DO NOTHING;
```

## Step 4: Verify Equipment Types Were Created

```sql
SELECT id, name, description FROM equipment_types ORDER BY name;
```

You should now see rows!

## Step 5: Upload Knowledge Documents

Once equipment types exist:

1. **Log into Admin Dashboard**
   - Go to https://www.equipiq.io
   - Log in with admin credentials

2. **Navigate to Knowledge Base**
   - Click on "Knowledge Base" in the sidebar

3. **Select Equipment Type**
   - Choose one of the equipment types you just created

4. **Upload a Document**
   - Click "Upload Document"
   - Select document type (Manual, Troubleshooting, FAQ, etc.)
   - Choose a file (PDF, TXT, MD)
   - Click "Upload"

5. **Wait for Processing**
   - System will extract text
   - Chunk into ~1000 character segments
   - Generate embeddings
   - Store in `knowledge_chunks` table

6. **Verify Upload**
   ```sql
   SELECT
     et.name,
     COUNT(kc.id) as chunks
   FROM equipment_types et
   LEFT JOIN knowledge_chunks kc ON kc.equipment_type_id = et.id
   GROUP BY et.name;
   ```

## Troubleshooting Upload Failures

### Error: "Failed to upload document"

**Possible Causes:**

1. **OpenAI API Key Not Set**
   ```bash
   npx supabase secrets set OPENAI_API_KEY=sk-your-key --project-ref enpqzoeohonguemzyifo
   ```

2. **PDF is Image-Based (Scanned)**
   - Use OCR software to convert to text PDF first
   - Or extract text manually and upload as .txt

3. **File Too Large**
   - Split large manuals into sections
   - Upload one section at a time

4. **Equipment Type Doesn't Exist**
   - Run Step 3 to create equipment types

### Check Edge Function Logs

1. Go to Supabase Dashboard
2. Click **Edge Functions** → **ingest-knowledge**
3. View **Logs** tab
4. Look for error messages during upload

## Expected Results After Setup

Once complete, your status query should show:

```sql
SELECT
  et.name as "Equipment Type",
  COUNT(DISTINCT kc.id) as "Knowledge Chunks",
  COUNT(DISTINCT ed.id) as "Documents"
FROM equipment_types et
LEFT JOIN knowledge_chunks kc ON kc.equipment_type_id = et.id
LEFT JOIN equipment_documentation ed ON ed.equipment_type_id = et.id
GROUP BY et.name;
```

**Example Output:**
```
Equipment Type              | Knowledge Chunks | Documents
----------------------------|------------------|-----------
VersaSpa Pro               | 45               | 1
Sybaritic Hydration        | 52               | 1
Ergoline Affinity 950      | 38               | 1
```

## Next Steps After Setup

Once you see knowledge chunks > 0:

1. **Test the Chatbot**
   - Go to https://www.equipiq.io
   - Select equipment with knowledge
   - Ask: "How do I clean the filters?"
   - Verify AI provides specific answers from your docs

2. **Upload More Documentation**
   - Add troubleshooting guides
   - Add FAQs
   - Add maintenance schedules

3. **Monitor Performance**
   - Check response quality
   - Collect user feedback
   - Refine documentation as needed

---

## Quick Commands Reference

```sql
-- Check all table counts
SELECT 'equipment_types' as table_name, COUNT(*) FROM equipment_types
UNION ALL SELECT 'knowledge_chunks', COUNT(*) FROM knowledge_chunks
UNION ALL SELECT 'equipment_documentation', COUNT(*) FROM equipment_documentation;

-- View all equipment types
SELECT * FROM equipment_types ORDER BY name;

-- View recent knowledge chunks
SELECT
  et.name,
  kc.source,
  LEFT(kc.content, 100) || '...' as preview
FROM knowledge_chunks kc
JOIN equipment_types et ON et.id = kc.equipment_type_id
ORDER BY kc.created_at DESC
LIMIT 10;

-- Delete all knowledge (if you need to start over)
-- TRUNCATE knowledge_chunks CASCADE;
-- DELETE FROM equipment_types CASCADE;
```

---

## What to Share With Me Next

Please run **Step 1** (the table count query) and share the results. This will tell me:
- Which schema has data (if any)
- Whether migrations need to be applied
- What the next step should be
