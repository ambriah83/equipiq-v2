# Knowledge Base Data Ingestion Guide

## Overview
This guide walks through ingesting troubleshooting conversation data from Limble into the EquipIQ knowledge base.

## Data Source
- **File**: `C:\Users\ambri\Projects\Development-Projects\Maintenance EquipIQ\Maint CHATGPT BOT ANALYSIS\fine-tuning-dataset-2025-07-18T18-51-43-964Z.jsonl`
- **Format**: JSONL (JSON Lines) with conversation threads
- **Total Conversations**: 650 conversations with 805 messages
- **Content**: Real troubleshooting conversations covering spray booths, tanning beds, and spa equipment

## Prerequisites

### 1. Environment Setup
Create or update `.env.local` with the following credentials:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://enpqzoeohonguemzyifo.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key

# Database Direct Connection
DATABASE_URL=postgresql://postgres:K8pzVGCcE96oC1Ff@db.enpqzoeohonguemzyifo.supabase.co:5432/postgres

# OpenAI API (for embeddings)
VITE_OPENAI_API_KEY=your-openai-api-key
```

### 2. Get Missing API Keys

#### Supabase Keys
1. Go to: https://supabase.com/dashboard/project/enpqzoeohonguemzyifo/settings/api
2. Copy the `anon` key → `VITE_SUPABASE_ANON_KEY`
3. Copy the `service_role` key → `SUPABASE_SERVICE_KEY`

#### OpenAI API Key
1. Go to: https://platform.openai.com/api-keys
2. Create a new key or use existing
3. Copy to `VITE_OPENAI_API_KEY`

### 3. Install Dependencies
```bash
cd "C:\Users\ambri\Projects\equipIQ v2"
npm install
```

## Database Schema

The ingestion script populates the `knowledge_chunks` table:

```sql
CREATE TABLE knowledge_chunks (
    id UUID PRIMARY KEY,
    equipment_type_id UUID REFERENCES equipment_types(id),
    content TEXT NOT NULL,           -- Full Q&A text
    embedding vector(1536),          -- OpenAI embedding
    metadata JSONB,                  -- User query, response, equipment type
    source TEXT,                     -- 'limble_troubleshooting_conversations'
    chunk_type TEXT,                 -- 'resolved_issue'
    created_at TIMESTAMP
);
```

## How the Ingestion Works

1. **Read JSONL File**: Loads all 650 conversations
2. **Extract Equipment Type**: Analyzes conversation content to determine equipment type (VersaSpa, Norvell, Affinity, etc.)
3. **Create Equipment Types**: Automatically creates equipment_type records if they don't exist
4. **Generate Embeddings**: Uses OpenAI API to create vector embeddings for semantic search
5. **Create Metadata**: Stores original user query, assistant response, and classification data
6. **Batch Insert**: Inserts in batches of 10 to respect API rate limits

## Running the Ingestion

### Option 1: Direct Execution
```bash
cd "C:\Users\ambri\Projects\equipIQ v2"
node scripts/ingest-knowledge-data.js
```

### Option 2: Add NPM Script (Recommended)
Add to `package.json`:
```json
{
  "scripts": {
    "ingest-knowledge": "node scripts/ingest-knowledge-data.js"
  }
}
```

Then run:
```bash
npm run ingest-knowledge
```

## Expected Output

```
=== EquipIQ Knowledge Base Ingestion ===

Reading data from: ...fine-tuning-dataset-2025-07-18T18-51-43-964Z.jsonl
Found 650 conversations

Processing batch 1 (conversations 1-10)...
Created new equipment type: versaspa
Created new equipment type: spray_tan
  ✓ Processed: 10, Inserted: 10, Errors: 0
  Waiting 2 seconds to respect rate limits...

Processing batch 2 (conversations 11-20)...
  ✓ Processed: 10, Inserted: 10, Errors: 0
...

=== Ingestion Complete ===
Total conversations processed: 650
Total chunks inserted: 650
Total errors: 0
```

## Equipment Type Classification

The script automatically classifies conversations into equipment types based on keywords:

- **versaspa**: VersaSpa, Versa Pro, Versa
- **norvell**: Norvell, Auto Revolution
- **affinity**: Affinity, Ergoline Affinity
- **prestige**: Prestige, Ergoline Prestige
- **megasun**: MegaSun
- **sybaritic**: Sybaritic, Hydration
- **beauty_angel**: Beauty Angel
- **spray_tan**: Generic spray booth
- **tanning_bed**: Generic UV bed
- **hydration**: HydraFacial, spa equipment
- **general**: Unclassified

## Verification Steps

After ingestion, verify in Supabase:

### 1. Check Total Records
```sql
SELECT COUNT(*) FROM knowledge_chunks;
-- Expected: ~650 records
```

### 2. Check Equipment Type Distribution
```sql
SELECT
  et.name as equipment_type,
  COUNT(kc.id) as chunk_count
FROM knowledge_chunks kc
JOIN equipment_types et ON kc.equipment_type_id = et.id
GROUP BY et.name
ORDER BY chunk_count DESC;
```

### 3. Verify Embeddings
```sql
SELECT
  COUNT(*) as total,
  COUNT(embedding) as with_embeddings,
  COUNT(*) - COUNT(embedding) as missing_embeddings
FROM knowledge_chunks;
```

### 4. Sample Data Check
```sql
SELECT
  et.name as equipment_type,
  kc.content,
  kc.metadata->>'user_query' as user_query,
  kc.source,
  kc.chunk_type
FROM knowledge_chunks kc
JOIN equipment_types et ON kc.equipment_type_id = et.id
LIMIT 5;
```

## Troubleshooting

### Issue: "OpenAI API key not found"
- Add `VITE_OPENAI_API_KEY` to `.env.local`
- Script will still run but won't generate embeddings
- You can add embeddings later with a separate script

### Issue: "Error creating equipment type"
- Check Supabase service key has proper permissions
- Verify RLS policies allow insertion

### Issue: Rate limit errors from OpenAI
- Increase `BATCH_SIZE` wait time in script
- Use a paid OpenAI tier for higher rate limits

### Issue: File not found
- Verify the data file path is correct
- Check that the JSONL file exists in the Development-Projects folder

## Cost Estimate

**OpenAI Embeddings**:
- Model: `text-embedding-ada-002`
- Cost: $0.0001 per 1K tokens
- Estimated tokens: ~650 conversations × 500 tokens avg = 325K tokens
- **Estimated cost: ~$0.03**

Very affordable for one-time ingestion!

## Next Steps

After successful ingestion:

1. **Test Knowledge Base Queries**
   - Use the `search-knowledge` edge function
   - Test semantic search with real troubleshooting questions

2. **Review Classifications**
   - Check if equipment types are correctly identified
   - Manually reclassify any misidentified conversations

3. **Add Manual Content**
   - Equipment manuals (PDFs)
   - Manufacturer documentation
   - Additional FAQs

4. **Set Up Continuous Ingestion**
   - Create workflow for new troubleshooting conversations
   - Automate embedding generation

## Support

For issues or questions:
- Check Supabase dashboard logs
- Review the ingestion script output
- Verify database permissions and RLS policies
