import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { text } = await req.json()
    
    if (!text) {
      return new Response(
        JSON.stringify({ error: "text is required" }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Get OpenAI API key
    const openaiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiKey) {
      // Return null embedding if OpenAI is not configured
      return new Response(
        JSON.stringify({ 
          embedding: null,
          message: "OpenAI API key not configured" 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      )
    }

    // Generate embedding
    const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: text.substring(0, 8191), // OpenAI has a token limit
        model: 'text-embedding-ada-002',
      }),
    })

    if (!embeddingResponse.ok) {
      const error = await embeddingResponse.text()
      console.error('OpenAI API error:', error)
      return new Response(
        JSON.stringify({ 
          embedding: null,
          error: "Failed to generate embedding" 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      )
    }

    const embeddingData = await embeddingResponse.json()
    const embedding = embeddingData.data[0].embedding

    return new Response(
      JSON.stringify({ embedding }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )
  } catch (error) {
    console.error('Error in generate-embedding function:', error)
    return new Response(
      JSON.stringify({ 
        embedding: null,
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )
  }
})