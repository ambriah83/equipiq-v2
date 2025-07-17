-- Enable pgvector extension for embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Equipment manufacturers and models
CREATE TABLE equipment_manufacturers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE equipment_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  manufacturer_id UUID REFERENCES equipment_manufacturers(id) ON DELETE CASCADE,
  model_name TEXT NOT NULL,
  category TEXT NOT NULL, -- 'spray_booth', 'hydration_station', 'uv_bed', etc.
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(manufacturer_id, model_name)
);

-- Knowledge base documents
CREATE TABLE knowledge_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_model_id UUID REFERENCES equipment_models(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  document_type TEXT NOT NULL, -- 'manual', 'troubleshooting', 'faq', 'maintenance'
  embedding vector(1536), -- OpenAI embedding dimension
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for vector similarity search
CREATE INDEX knowledge_documents_embedding_idx ON knowledge_documents 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Chat conversations
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  equipment_model_id UUID REFERENCES equipment_models(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chat messages
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}', -- Store confidence, sources, etc.
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Query analytics
CREATE TABLE query_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  equipment_model_id UUID REFERENCES equipment_models(id),
  query_type TEXT,
  confidence_score FLOAT,
  helpful BOOLEAN,
  resolution_time_seconds INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX conversations_user_id_idx ON conversations(user_id);
CREATE INDEX messages_conversation_id_idx ON messages(conversation_id);
CREATE INDEX query_analytics_equipment_model_idx ON query_analytics(equipment_model_id);
CREATE INDEX knowledge_documents_equipment_model_idx ON knowledge_documents(equipment_model_id);

-- RLS Policies
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE query_analytics ENABLE ROW LEVEL SECURITY;

-- Users can only see their own conversations
CREATE POLICY "Users can view own conversations" ON conversations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own conversations" ON conversations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can see messages in their conversations
CREATE POLICY "Users can view messages in own conversations" ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversations 
      WHERE conversations.id = messages.conversation_id 
      AND conversations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create messages in own conversations" ON messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversations 
      WHERE conversations.id = messages.conversation_id 
      AND conversations.user_id = auth.uid()
    )
  );

-- Insert some initial equipment data
INSERT INTO equipment_manufacturers (name) VALUES 
  ('VersaSpa'),
  ('MegaSun'),
  ('Ergoline'),
  ('HydraFacial');

INSERT INTO equipment_models (manufacturer_id, model_name, category) VALUES 
  ((SELECT id FROM equipment_manufacturers WHERE name = 'VersaSpa'), 'VersaSpa Pro', 'spray_booth'),
  ((SELECT id FROM equipment_manufacturers WHERE name = 'VersaSpa'), 'VersaSpa Elite', 'spray_booth'),
  ((SELECT id FROM equipment_manufacturers WHERE name = 'HydraFacial'), 'HydraFacial MD', 'hydration_station'),
  ((SELECT id FROM equipment_manufacturers WHERE name = 'MegaSun'), 'MegaSun 6900', 'uv_bed'),
  ((SELECT id FROM equipment_manufacturers WHERE name = 'Ergoline'), 'Prestige 1400', 'uv_bed');