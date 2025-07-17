# Database Migration Instructions

Since we're having authentication issues with the Supabase CLI, please run this migration manually:

1. Go to https://supabase.com/dashboard/project/enpqzoeohonguemzyifo/sql/new
2. Copy and paste the entire contents of `/supabase/migrations/001_equipment_knowledge_base.sql`
3. Click "Run" to execute the migration

This will create:
- Equipment manufacturers and models tables
- Knowledge documents table with vector embeddings
- Conversation history tables
- Query analytics tables
- All necessary indexes and RLS policies

After running the migration, the Knowledge Base tab in your admin dashboard will be fully functional!