import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
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
    const { query } = await req.json()
    
    if (!query) {
      return new Response(
        JSON.stringify({ error: "Query is required" }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Initialize Gemini
    const apiKey = Deno.env.get('GEMINI_API_KEY')
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY not configured')
    }

    const genAI = new GoogleGenerativeAI(apiKey)
    
    // Try multiple models in order of preference
    const preferredModel = Deno.env.get('GEMINI_MODEL') || "gemini-1.5-flash"
    const modelNames = [preferredModel, "gemini-1.5-flash", "gemini-1.5-pro", "gemini-pro"]
      .filter((v, i, a) => a.indexOf(v) === i) // Remove duplicates
    let model = null
    let lastError = null
    
    for (const modelName of modelNames) {
      try {
        model = genAI.getGenerativeModel({ model: modelName })
        // Test if model works by making a simple request
        await model.generateContent("test")
        console.log(`Using model: ${modelName}`)
        break
      } catch (error) {
        console.warn(`Model ${modelName} failed:`, error.message)
        lastError = error
      }
    }
    
    if (!model) {
      throw new Error(`All models failed. Last error: ${lastError?.message}`)
    }

    // Create a context-aware prompt
    const prompt = `You are EquipIQ, an AI assistant specialized in equipment maintenance and troubleshooting. 
    
    User Query: ${query}
    
    Please provide a helpful, concise response. If the query relates to equipment issues, suggest relevant troubleshooting steps or recommend creating a maintenance ticket if necessary.`

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    return new Response(
      JSON.stringify({ reply: text }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )
  } catch (error) {
    console.error('Error in ask-equip-iq function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})