import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { query, equipmentModelId, limit = 5 } = await req.json()
    
    if (!query) {
      return new Response(
        JSON.stringify({ error: "Query is required" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // 1. TRADITIONAL SEARCH - Keyword matching
    const keywordSearchQuery = supabase
      .from('knowledge_documents')
      .select('id, title, content, document_type, equipment_model_id')
      .textSearch('content', query, {
        type: 'websearch',
        config: 'english'
      })
      .limit(limit)

    if (equipmentModelId) {
      keywordSearchQuery.eq('equipment_model_id', equipmentModelId)
    }

    const { data: keywordResults, error: keywordError } = await keywordSearchQuery

    if (keywordError) {
      console.error('Keyword search error:', keywordError)
    }

    // 2. VECTOR SEARCH - Semantic similarity
    let vectorResults = []
    
    // First, generate embedding for the query
    const openAIKey = Deno.env.get('OPENAI_API_KEY')
    if (openAIKey) {
      const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'text-embedding-ada-002',
          input: query,
        }),
      })

      if (embeddingResponse.ok) {
        const embeddingData = await embeddingResponse.json()
        const queryEmbedding = embeddingData.data[0].embedding

        // Perform vector similarity search
        const { data: vectorData, error: vectorError } = await supabase.rpc('match_documents', {
          query_embedding: queryEmbedding,
          match_threshold: 0.7,
          match_count: limit,
          equipment_model_id: equipmentModelId
        })

        if (!vectorError && vectorData) {
          vectorResults = vectorData
        }
      }
    }

    // 3. COMBINE AND DEDUPLICATE RESULTS
    const allResults = new Map()
    
    // Add keyword results
    if (keywordResults) {
      keywordResults.forEach(doc => {
        allResults.set(doc.id, {
          ...doc,
          search_type: 'keyword',
          relevance_score: 1.0 // Keyword matches get high relevance
        })
      })
    }

    // Add vector results (may overlap)
    vectorResults.forEach(doc => {
      if (allResults.has(doc.id)) {
        // Document found by both methods - boost its score
        const existing = allResults.get(doc.id)
        existing.relevance_score += doc.similarity
        existing.search_type = 'hybrid'
      } else {
        allResults.set(doc.id, {
          ...doc,
          search_type: 'vector',
          relevance_score: doc.similarity
        })
      }
    })

    // Sort by relevance score
    const sortedResults = Array.from(allResults.values())
      .sort((a, b) => b.relevance_score - a.relevance_score)
      .slice(0, limit)

    // 4. PREPARE CONTEXT FOR AI
    const context = {
      keyword_matches: keywordResults?.length || 0,
      vector_matches: vectorResults.length,
      hybrid_matches: sortedResults.filter(r => r.search_type === 'hybrid').length,
      documents: sortedResults.map(doc => ({
        title: doc.title,
        type: doc.document_type,
        content: doc.content.substring(0, 2000), // Limit content length
        relevance: doc.relevance_score,
        search_type: doc.search_type
      }))
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        context,
        summary: `Found ${sortedResults.length} relevant documents using hybrid search`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in search-knowledge function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

// Add this SQL function to your database:
/*
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
*/