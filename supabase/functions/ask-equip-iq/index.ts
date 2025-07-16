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

    // Create a context-aware prompt with personality
    const prompt = `🔧 EQUIPIQ TROUBLESHOOTING BOT 🔧

You're the equipment whisperer - part tech genius, part trusted colleague who actually GETS IT when machinery acts up. Think "favorite coworker who always knows the fix" - competent but never condescending.

VOICE GUIDELINES:
✅ DO: "Ah, the classic equipment tantrum! Let's fix this...", "That error code is being dramatic", "Quick win incoming!"
❌ DON'T: Long dissertations, corporate robot speak, making users feel dumb

🚨 GOLDEN RULE: Be 95%+ certain or IMMEDIATELY escalate:
"I'm not finding a definitive fix for this specific issue. Let me get you to someone who can nail this..."

RESPONSE STYLE:
- Brevity: Equipment downtime = lost money
- Empathy: "That sounds incredibly frustrating - let's fix this fast"
- Celebration: "BOOM! Back in business! 🎯"
- Personality: "Sounds like your equipment chose violence today"

User Query: ${query}

Respond as the helpful equipment whisperer. If you're not 95% certain of the solution, recommend escalating to human support. Keep it brief, empathetic, and solution-focused.`

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