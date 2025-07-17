import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.1.3"
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
    const { query, conversationId, equipmentModelId, context } = await req.json()
    
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
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // STEP 1: Search knowledge base using hybrid search
    let knowledgeContext = ""
    let searchResults = null
    
    try {
      // Call our search-knowledge function
      const searchResponse = await fetch(`${supabaseUrl}/functions/v1/search-knowledge`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          equipmentModelId,
          limit: 5
        })
      })

      if (searchResponse.ok) {
        searchResults = await searchResponse.json()
        
        if (searchResults.context && searchResults.context.documents.length > 0) {
          knowledgeContext = `
## KNOWLEDGE BASE CONTEXT
I found ${searchResults.context.documents.length} relevant documents:
- ${searchResults.context.keyword_matches} exact keyword matches
- ${searchResults.context.vector_matches} semantic matches
- ${searchResults.context.hybrid_matches} documents matched both methods

### Relevant Information:
`
          searchResults.context.documents.forEach((doc, index) => {
            knowledgeContext += `
${index + 1}. **${doc.title}** (${doc.type})
   Search type: ${doc.search_type}, Relevance: ${(doc.relevance * 100).toFixed(0)}%
   ${doc.content}
   
`
          })
        }
      }
    } catch (error) {
      console.error('Knowledge search error:', error)
      // Continue without knowledge context
    }

    // STEP 2: Store the conversation if conversationId provided
    let messageId = null
    if (conversationId) {
      try {
        const { data: messageData } = await supabase
          .from('messages')
          .insert({
            conversation_id: conversationId,
            role: 'user',
            content: query
          })
          .select()
          .single()
        
        if (messageData) {
          messageId = messageData.id
        }
      } catch (error) {
        console.error('Error storing message:', error)
      }
    }

    // STEP 3: Generate AI response with knowledge context
    const apiKey = Deno.env.get('GEMINI_API_KEY')
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY not configured')
    }

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 300,
        topP: 0.8,
        topK: 40,
      }
    })

    // Build equipment context string
    let equipmentContext = ""
    if (context && (context.location || context.equipment)) {
      equipmentContext = `
## CURRENT EQUIPMENT CONTEXT
Location: ${context.location || 'Not specified'}
Equipment: ${context.equipment || 'Not specified'}
${context.equipmentId ? `Equipment ID: ${context.equipmentId}` : ''}

`
    }

    // Enhanced prompt with knowledge context
    const enhancedPrompt = `# 🔧 EQUIPIQ TROUBLESHOOTING ASSISTANT 🔧

${equipmentContext}
${knowledgeContext}

## YOUR TASK
You are EquipIQ, an expert in tanning salon equipment troubleshooting. ${context?.equipment ? `You are specifically helping with: ${context.equipment} at ${context.location || 'the salon'}.` : ""} ${knowledgeContext ? "Use the knowledge base context above to provide accurate, specific solutions." : ""}

## RESPONSE RULES:
1. **KEEP IT SHORT** - 2-3 sentences max per paragraph
2. **USE BULLET POINTS** for all questions and steps
3. **BE SPECIFIC** - Reference exact error codes, model numbers, and procedures from the knowledge base
4. **CONFIDENCE RULE** - If you're not 95% certain about the solution, say: "I need to get you to a specialist for this issue."
5. **EQUIPMENT AWARE** - When equipment is specified, tailor your response to that specific model

## FORMATTING:
For questions:
"I need to know:"
• Question 1?
• Question 2?

For steps:
"Here's what to do:"
1. Step one
2. Step two

${knowledgeContext ? "## IMPORTANT: Prioritize information from the knowledge base over general knowledge. If the knowledge base contradicts general troubleshooting, follow the knowledge base." : ""}

User Query: ${query}

Provide a SHORT, CLEAR response using bullet points.`

    const result = await model.generateContent(enhancedPrompt)
    const response = await result.response
    const aiResponse = response.text()

    // STEP 4: Store AI response if we have a conversation
    if (conversationId && messageId) {
      try {
        const { data: aiMessageData } = await supabase
          .from('messages')
          .insert({
            conversation_id: conversationId,
            role: 'assistant',
            content: aiResponse,
            metadata: {
              knowledge_used: searchResults?.context ? true : false,
              documents_referenced: searchResults?.context?.documents.length || 0,
              model: 'gemini-1.5-flash'
            }
          })
          .select()
          .single()
      } catch (error) {
        console.error('Error storing AI response:', error)
      }
    }

    return new Response(
      JSON.stringify({ 
        reply: aiResponse,
        messageId: messageId,
        knowledgeUsed: !!searchResults?.context
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )
  } catch (error) {
    console.error('Error in ask-equip-iq-v2 function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})