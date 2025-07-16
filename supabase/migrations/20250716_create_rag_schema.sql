-- Enable vector extension for embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Companies table
CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User profiles (extends Supabase auth.users)
CREATE TYPE user_role AS ENUM ('owner', 'manager', 'staff');

CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    role user_role NOT NULL DEFAULT 'staff',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Equipment types
CREATE TABLE IF NOT EXISTS equipment_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Knowledge chunks for hybrid RAG
CREATE TABLE IF NOT EXISTS knowledge_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    equipment_type_id UUID REFERENCES equipment_types(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    embedding vector(1536), -- OpenAI embedding size
    metadata JSONB DEFAULT '{}',
    source TEXT,
    chunk_type TEXT DEFAULT 'manual', -- 'manual', 'faq', 'resolved_issue'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Full text search
    search_vector tsvector GENERATED ALWAYS AS (to_tsvector('english', content)) STORED
);

-- Indexes for hybrid search
CREATE INDEX idx_knowledge_chunks_embedding ON knowledge_chunks USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX idx_knowledge_chunks_search ON knowledge_chunks USING GIN (search_vector);
CREATE INDEX idx_knowledge_chunks_equipment ON knowledge_chunks(equipment_type_id);

-- Equipment documentation
CREATE TABLE IF NOT EXISTS equipment_documentation (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    equipment_type_id UUID REFERENCES equipment_types(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT,
    file_url TEXT,
    doc_type TEXT DEFAULT 'manual', -- 'manual', 'guide', 'specification'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chat sessions
CREATE TABLE IF NOT EXISTS chat_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    equipment_type_id UUID REFERENCES equipment_types(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved BOOLEAN DEFAULT FALSE,
    resolution_notes TEXT
);

-- Chat messages
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE,
    role TEXT CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row Level Security
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_documentation ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Companies: Users can only see their own company
CREATE POLICY "Users can view own company" ON companies
    FOR SELECT USING (id IN (
        SELECT company_id FROM profiles WHERE id = auth.uid()
    ));

-- Profiles: Users can see profiles in their company
CREATE POLICY "Users can view company profiles" ON profiles
    FOR SELECT USING (company_id IN (
        SELECT company_id FROM profiles WHERE id = auth.uid()
    ));

-- Equipment types: All authenticated users can view
CREATE POLICY "Authenticated users can view equipment types" ON equipment_types
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- Knowledge chunks: All authenticated users can view
CREATE POLICY "Authenticated users can view knowledge" ON knowledge_chunks
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- Chat sessions: Users can only see their own sessions
CREATE POLICY "Users can view own sessions" ON chat_sessions
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create own sessions" ON chat_sessions
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Chat messages: Users can see messages from their sessions
CREATE POLICY "Users can view own messages" ON chat_messages
    FOR SELECT USING (session_id IN (
        SELECT id FROM chat_sessions WHERE user_id = auth.uid()
    ));

CREATE POLICY "Users can create messages in own sessions" ON chat_messages
    FOR INSERT WITH CHECK (session_id IN (
        SELECT id FROM chat_sessions WHERE user_id = auth.uid()
    ));

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();