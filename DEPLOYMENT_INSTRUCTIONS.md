# EquipIQ V2 Deployment Instructions

## Overview
We've built a comprehensive AI troubleshooting system with:
- **Hybrid Knowledge Base**: Combines keyword search + vector embeddings
- **Feedback System**: Users can rate responses
- **Improvement Cases**: Bad responses are flagged for review
- **Fine-tuning Infrastructure**: Approved improvements train better models

## Database Migrations

Run these migrations in order through the Supabase SQL editor:

### 1. Equipment & Knowledge Base Schema
Go to: https://supabase.com/dashboard/project/enpqzoeohonguemzyifo/sql/new

Copy and run the contents of:
- `/supabase/migrations/001_equipment_knowledge_base.sql`

This creates:
- Equipment manufacturers and models tables
- Knowledge documents with vector embeddings
- Conversation history tracking
- Query analytics

### 2. Fine-tuning System Schema
Next, run:
- `/supabase/migrations/002_fine_tuning_system.sql`

This creates:
- Feedback collection
- Improvement case management
- Fine-tuning job tracking
- Training examples storage
- Model evaluation tables

### 3. Vector Search Function
After migrations, create this function:

```sql
CREATE OR REPLACE FUNCTION match_documents(
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  equipment_model_id uuid DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  title text,
  content text,
  document_type text,
  equipment_model_id uuid,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    kd.id,
    kd.title,
    kd.content,
    kd.document_type,
    kd.equipment_model_id,
    1 - (kd.embedding <=> query_embedding) AS similarity
  FROM knowledge_documents kd
  WHERE 
    (equipment_model_id IS NULL OR kd.equipment_model_id = match_documents.equipment_model_id)
    AND 1 - (kd.embedding <=> query_embedding) > match_threshold
  ORDER BY kd.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
```

## Edge Functions Deployed

✅ **generate-embedding** - Creates OpenAI embeddings for documents
✅ **search-knowledge** - Hybrid search (keyword + vector)
✅ **ask-equip-iq-v2** - Enhanced chat with knowledge base context

## Environment Variables Needed

Add these to your Supabase project:
- `OPENAI_API_KEY` - For embeddings (you have this)
- `GEMINI_API_KEY` - For AI responses (already set)

## Frontend Updates

The updated components include:
- **MessageFeedback.jsx** - Star ratings and thumbs up/down
- **KnowledgeBaseManager.jsx** - Upload equipment manuals
- **ImprovementCaseManager.jsx** - Review bad responses
- **AdminDashboard.jsx** - Updated with new features

## Next Steps

1. **Update Frontend to Use New Edge Function**
   - Change API calls from `ask-equip-iq` to `ask-equip-iq-v2`
   - Pass `conversationId` and `equipmentModelId` in requests

2. **Start Uploading Knowledge**
   - Go to Admin → Knowledge Base
   - Upload manuals for each equipment type
   - PDFs, text files, markdown all supported

3. **Monitor Feedback**
   - Watch for low-rated responses
   - Review improvement cases daily
   - Approve good suggestions to improve AI

4. **Fine-tuning (Future)**
   - Collect 100+ approved improvements
   - Run fine-tuning job
   - Deploy new model

## Key Features

### For Users:
- Accurate, equipment-specific answers
- Rate responses to improve system
- Faster, more helpful troubleshooting

### For Admins:
- Upload equipment documentation
- Review and improve bad responses  
- Track system performance
- Train custom AI models

This system will continuously improve as:
1. More documentation is uploaded
2. More feedback is collected
3. More improvements are approved
4. Fine-tuned models are deployed