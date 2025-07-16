import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Function to split text into chunks
function splitTextIntoChunks(text: string, maxChunkSize: number = 1000): string[] {
  const sentences = text.match(/[^.!?]+[.!?]+/g) || []
  const chunks: string[] = []
  let currentChunk = ''

  for (const sentence of sentences) {
    if ((currentChunk + sentence).length > maxChunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.trim())
      currentChunk = sentence
    } else {
      currentChunk += ' ' + sentence
    }
  }

  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk.trim())
  }

  return chunks
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { 
      equipment_type_id, 
      content, 
      title, 
      source = 'manual',
      chunk_type = 'manual',
      process_type = 'chunk' // 'chunk' or 'full'
    } = await req.json()
    
    if (!equipment_type_id || !content) {
      return new Response(
        JSON.stringify({ error: "equipment_type_id and content are required" }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get OpenAI API key
    const openaiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiKey) {
      throw new Error('OPENAI_API_KEY not configured')
    }

    // Process content based on type
    let chunks: string[] = []
    
    if (process_type === 'chunk') {
      chunks = splitTextIntoChunks(content)
    } else {
      chunks = [content] // Process as single chunk
    }

    console.log(`Processing ${chunks.length} chunks for equipment type ${equipment_type_id}`)

    // Process each chunk
    const results = []
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i]
      
      // Generate embedding for the chunk
      const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: chunk,
          model: 'text-embedding-ada-002',
        }),
      })

      if (!embeddingResponse.ok) {
        throw new Error(`OpenAI API error: ${await embeddingResponse.text()}`)
      }

      const embeddingData = await embeddingResponse.json()
      const embedding = embeddingData.data[0].embedding

      // Store in database
      const { data, error } = await supabase
        .from('knowledge_chunks')
        .insert({
          equipment_type_id,
          content: chunk,
          embedding,
          source: source || title || 'manual',
          chunk_type,
          metadata: {
            title,
            chunk_index: i,
            total_chunks: chunks.length,
            original_length: content.length,
            ingested_at: new Date().toISOString()
          }
        })
        .select()

      if (error) {
        console.error(`Error inserting chunk ${i}:`, error)
        throw error
      }

      results.push(data[0])
    }

    // If a title was provided, also store the full document
    if (title) {
      const { error: docError } = await supabase
        .from('equipment_documentation')
        .insert({
          equipment_type_id,
          title,
          content,
          doc_type: chunk_type
        })

      if (docError) {
        console.error('Error storing document:', docError)
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        chunks_created: results.length,
        message: `Successfully ingested ${results.length} knowledge chunks`
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )
  } catch (error) {
    console.error('Error in ingest-knowledge function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})