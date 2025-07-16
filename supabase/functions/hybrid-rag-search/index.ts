import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.1.3"

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
    const { query, equipment_type_id, session_id } = await req.json()
    
    if (!query) {
      return new Response(
        JSON.stringify({ error: "Query is required" }),
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

    // Get auth token from request
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    // Verify user
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      throw new Error('Unauthorized')
    }

    // STEP 1: Generate embedding for the query
    const openaiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiKey) {
      throw new Error('OPENAI_API_KEY not configured')
    }

    const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: query,
        model: 'text-embedding-ada-002',
      }),
    })

    const embeddingData = await embeddingResponse.json()
    const queryEmbedding = embeddingData.data[0].embedding

    // STEP 2: Perform hybrid search (parallel execution)
    const searchPromises = []

    // Vector search
    const vectorSearchPromise = supabase.rpc('match_knowledge_chunks', {
      query_embedding: queryEmbedding,
      match_threshold: 0.7,
      match_count: 5,
      equipment_type_id: equipment_type_id
    })

    // Keyword search using full-text search
    const keywordSearchPromise = supabase
      .from('knowledge_chunks')
      .select('id, content, metadata, source')
      .textSearch('search_vector', query.split(' ').join(' & '))
      .eq(equipment_type_id ? 'equipment_type_id' : 'id', equipment_type_id || 'id')
      .limit(5)

    searchPromises.push(vectorSearchPromise, keywordSearchPromise)
    const [vectorResults, keywordResults] = await Promise.all(searchPromises)

    if (vectorResults.error) {
      console.error('Vector search error:', vectorResults.error)
    }
    if (keywordResults.error) {
      console.error('Keyword search error:', keywordResults.error)
    }

    // Combine and deduplicate results
    const allResults = new Map()
    
    // Add vector search results
    if (vectorResults.data) {
      vectorResults.data.forEach((result: any) => {
        allResults.set(result.id, {
          ...result,
          search_type: 'vector',
          relevance_score: result.similarity
        })
      })
    }

    // Add keyword search results
    if (keywordResults.data) {
      keywordResults.data.forEach((result: any) => {
        if (allResults.has(result.id)) {
          // If already found by vector search, mark as both
          allResults.get(result.id).search_type = 'both'
        } else {
          allResults.set(result.id, {
            ...result,
            search_type: 'keyword',
            relevance_score: 0.5 // Default score for keyword-only matches
          })
        }
      })
    }

    // Convert to array and sort by relevance
    const combinedResults = Array.from(allResults.values())
      .sort((a, b) => {
        // Prioritize results found by both methods
        if (a.search_type === 'both' && b.search_type !== 'both') return -1
        if (b.search_type === 'both' && a.search_type !== 'both') return 1
        return (b.relevance_score || 0) - (a.relevance_score || 0)
      })

    // STEP 3: Use AI to synthesize the best answer
    const geminiKey = Deno.env.get('GEMINI_API_KEY')
    if (!geminiKey) {
      throw new Error('GEMINI_API_KEY not configured')
    }

    const genAI = new GoogleGenerativeAI(geminiKey)
    
    // Try multiple models with fallback
    const preferredModel = Deno.env.get('GEMINI_MODEL') || "gemini-1.5-flash"
    const modelNames = [preferredModel, "gemini-1.5-flash", "gemini-1.5-pro", "gemini-pro"]
      .filter((v, i, a) => a.indexOf(v) === i)
    
    let model = null
    for (const modelName of modelNames) {
      try {
        model = genAI.getGenerativeModel({ model: modelName })
        break
      } catch (error) {
        console.warn(`Model ${modelName} failed:`, error)
      }
    }

    if (!model) {
      throw new Error('No available Gemini models')
    }

    // Create context from search results
    const context = combinedResults.map((result, index) => {
      return `[Source ${index + 1} - ${result.search_type} search, relevance: ${result.relevance_score?.toFixed(2) || 'N/A'}]:\n${result.content}\n`
    }).join('\n---\n')

    // Craft the synthesis prompt with full personality
    const synthesisPrompt = `🔧 EQUIPIQ TROUBLESHOOTING BOT COMPLETE PROMPT 🔧

CORE PERSONALITY:
You're the equipment whisperer - part tech genius, part trusted colleague who actually GETS IT when machinery acts up. Think "favorite coworker who always knows the fix" - competent but never condescending.

VOICE GUIDELINES:
✅ DO THIS:
- "Ah, the classic [equipment] tantrum! Let's fix this in 3 steps..."
- "That error code is being dramatic. Here's what it really means..."
- "Quick win incoming! Try this first - works 90% of the time"
- "Nice catch! You just saved yourself a service call 💪"
- "Plot twist - it's probably just [simple fix]. Let's check..."

❌ NOT THIS:
- Long technical dissertations
- "Have you tried turning it off and on?" (unless genuinely needed)
- Making users feel dumb for not knowing
- Corporate robot speak

🚨 GOLDEN RULE: CERTAINTY OR ESCALATE 🚨
NO GUESSING POLICY. Period.

Based on the knowledge base results below:
- If you find CLEAR, SPECIFIC solutions with 95%+ certainty: Provide the solution confidently
- If <95% certain or no clear match: IMMEDIATELY escalate with:
  "I'm not finding a definitive fix for this specific issue. Let me get you to someone who can nail this - creating your ticket now..."
  "This one's outside my wheelhouse. Getting you expert help ASAP..."

CURRENT CONTEXT:
User Query: ${query}

Knowledge Base Results (${combinedResults.length} sources found):
${context || 'No specific knowledge found in the database.'}

RESPONSE REQUIREMENTS:
1. If knowledge base has a clear answer (especially if found by "both" search types), deliver it with confidence
2. If unclear or no good matches, escalate immediately - don't guess
3. Keep it brief - equipment downtime = lost money
4. Show empathy: "That sounds incredibly frustrating" when appropriate
5. Celebrate fixes: "BOOM! Back in business! 🎯"
6. Use personality: "Classic case of equipment amnesia" etc.

SITUATIONAL AWARENESS:
- If this seems like a repeat issue, acknowledge it: "I see this has given you trouble before"
- For urgent issues: "I know every minute counts during production hours"
- For common problems: "You're not alone - this happens to everyone. Quick fix coming up!"

Remember: Be the calm in their storm. Make them feel like they just texted their smartest friend who knows EVERYTHING about their equipment.

Provide your response now:`

    const result = await model.generateContent(synthesisPrompt)
    const response = await result.response
    const aiResponse = response.text()

    // Store the interaction if session_id is provided
    if (session_id && user) {
      // Store user message
      await supabase
        .from('chat_messages')
        .insert({
          session_id,
          role: 'user',
          content: query,
          metadata: { equipment_type_id }
        })

      // Store AI response
      await supabase
        .from('chat_messages')
        .insert({
          session_id,
          role: 'assistant',
          content: aiResponse,
          metadata: {
            sources_found: combinedResults.length,
            search_types: [...new Set(combinedResults.map(r => r.search_type))]
          }
        })
    }

    return new Response(
      JSON.stringify({
        reply: aiResponse,
        sources: combinedResults.slice(0, 3).map(r => ({
          content: r.content.substring(0, 200) + '...',
          type: r.search_type,
          relevance: r.relevance_score
        })),
        search_stats: {
          total_sources: combinedResults.length,
          vector_matches: combinedResults.filter(r => r.search_type.includes('vector')).length,
          keyword_matches: combinedResults.filter(r => r.search_type.includes('keyword')).length
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )
  } catch (error) {
    console.error('Error in hybrid-rag-search function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})