-- Create function for vector similarity search
CREATE OR REPLACE FUNCTION match_knowledge_chunks(
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  equipment_type_id uuid DEFAULT NULL
)
RETURNS TABLE(
  id uuid,
  content text,
  metadata jsonb,
  source text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    kc.id,
    kc.content,
    kc.metadata,
    kc.source,
    1 - (kc.embedding <=> query_embedding) as similarity
  FROM knowledge_chunks kc
  WHERE 
    1 - (kc.embedding <=> query_embedding) > match_threshold
    AND (equipment_type_id IS NULL OR kc.equipment_type_id = equipment_type_id)
  ORDER BY kc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;