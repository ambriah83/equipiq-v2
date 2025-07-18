// supabase/functions/ask-equip-iq-v2/index.ts
// This is the new, stateful conversational engine.
// It moves beyond simple Q&A to a guided diagnostic process.

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.44.2'
import { OpenAI } from 'https://esm.sh/openai@4.52.1'

// --- Configuration ---
// It is critical that these environment variables are set in your Supabase project.
const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
const openaiApiKey = Deno.env.get('OPENAI_API_KEY')!

const openai = new OpenAI({ apiKey: openaiApiKey })

// --- Core System Prompt ---
// This prompt defines the AI's persona and its mission.
// It's engineered based on the "Expert Technician Framework".
const SYSTEM_PROMPT = `
You are EquipIQ, a world-class AI diagnostic technician for high-end spa and wellness equipment. Your personality is that of a calm, confident, and hyper-competent expert. You are talking to a spa technician who is under pressure. Your goal is to get their equipment back online as fast as possible.

**Your Core Directives:**
1. **Acknowledge & Align (Empathy First):** Always start by acknowledging the user's problem and validating their frustration. Example: "I understand how frustrating a cold hydration unit can be. Let's get this sorted out quickly."
2. **Clarify & Confirm (One Question at a Time):** Never ask multiple questions at once. Guide the conversation by asking one single, simple question at a time. Use the context you have.
3. **Diagnose & Act (The Interactive Loop):** Guide the user through a single, simple action. Wait for their feedback. Use their response to determine the next step.
4. **Use Your Knowledge:** You will be provided with relevant context from the equipment's knowledge base. Use this to form your diagnostic steps. Start with the most common and simplest solutions first.
5. **Generate Quick Replies:** For every question you ask, you MUST provide a 'quick_replies' array with 2-4 short, clear options for the user to click. This keeps the diagnosis on track.
6. **Intelligent Escalation (The Golden Handoff):** If you exhaust all diagnostic steps from the provided context, or if the user indicates a step has failed, your final action is to escalate. Do not apologize. State the likely cause and inform the user that you have created a ticket with all the details. Example: "It sounds like we've confirmed a faulty heating element. I've created a priority service ticket with all our diagnostic steps. A specialist will be in touch shortly. You won't have to repeat yourself."

**Response Format:**
You must respond with valid JSON containing:
{
  "response": "Your conversational response text",
  "quick_replies": ["Option 1", "Option 2", "Option 3"] // 2-4 short options, or empty array if not applicable
}

**Conversation Flow Example:**
User: "my hydration unit won't heat up"
You: {
  "response": "Ugh, a cold hydration unit can shut down a whole room. I get it. I see you're working with equipment at your location. Is that the unit we're troubleshooting?",
  "quick_replies": ["Yes, that's right", "No, it's a different one"]
}
User: "Yes, that's right"
You: {
  "response": "Great. Before we dive in, have you already tried anything to fix it?",
  "quick_replies": ["Checked the power", "Reset the breaker", "No, nothing yet"]
}
...and so on.
`

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// --- Main Server Logic ---
serve(async (req) => {
  // 1. Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 2. Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: req.headers.get('Authorization')! } },
    })

    // 3. Extract payload from request
    const { messages, equipment_type_id, equipment_name } = await req.json()
    if (!messages) {
      throw new Error('Missing `messages` in request body.')
    }

    // 4. Perform RAG search to get context for the AI
    let contextText = ''
    const lastUserMessage = messages[messages.length - 1]?.content
    if (lastUserMessage && equipment_type_id) {
      const { data: ragData, error: ragError } = await supabase.functions.invoke('hybrid-rag-search', {
        body: {
          query: lastUserMessage,
          equipment_type_id: equipment_type_id,
        },
      })

      if (ragError) {
        console.error('Error invoking hybrid-rag-search:', ragError)
        // Non-fatal. We can proceed without context, but the AI will be less effective.
      } else if (ragData?.response) {
        contextText = ragData.response
      }
    }

    // 5. Construct the prompt for the OpenAI API
    const finalSystemPrompt = `${SYSTEM_PROMPT}\n\n--- RELEVANT KNOWLEDGE BASE CONTEXT ---\n${
      contextText || 'No specific context found. Rely on general troubleshooting knowledge.'
    }\n--- END CONTEXT ---${
      equipment_name ? `\n\nThe user is working with: ${equipment_name}` : ''
    }`

    const openAiMessages = [
      { role: 'system', content: finalSystemPrompt },
      ...messages.map((m: any) => ({ role: m.role, content: m.content })),
    ]

    // 6. Call OpenAI API using JSON mode to enforce the response structure
    const response = await openai.chat.completions.create({
      model: 'gpt-4o', // Or 'gpt-4-turbo'
      messages: openAiMessages,
      temperature: 0.5, // Lower temperature for more predictable diagnostic steps
      response_format: { type: 'json_object' },
    })

    const botResponseContent = response.choices[0].message.content
    if (!botResponseContent) {
      throw new Error('OpenAI returned an empty response.')
    }

    // 7. Parse the JSON response from the AI
    // The AI is instructed to return a JSON object with 'response' and 'quick_replies'
    const parsedResponse = JSON.parse(botResponseContent)

    // 8. Return the structured response to the frontend
    return new Response(JSON.stringify(parsedResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('An error occurred:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})