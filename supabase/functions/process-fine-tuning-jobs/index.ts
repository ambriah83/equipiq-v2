import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

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
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get OpenAI API key
    const openaiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiKey) {
      throw new Error('OPENAI_API_KEY not configured')
    }

    // Step 1: Check for pending fine-tuning jobs
    const { data: pendingJobs, error: jobError } = await supabase
      .from('fine_tuning_jobs')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(1)

    if (jobError) throw jobError

    if (!pendingJobs || pendingJobs.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No pending jobs' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      )
    }

    const job = pendingJobs[0]
    console.log(`Processing fine-tuning job: ${job.id}`)

    // Step 2: Update job status to 'preparing'
    await supabase
      .from('fine_tuning_jobs')
      .update({ 
        status: 'preparing',
        started_at: new Date().toISOString()
      })
      .eq('id', job.id)

    // Step 3: Fetch approved training examples
    const { data: examples, error: examplesError } = await supabase
      .from('training_examples')
      .select(`
        *,
        improvement_cases!inner(status)
      `)
      .eq('improvement_cases.status', 'approved')

    if (examplesError) throw examplesError

    console.log(`Found ${examples?.length || 0} approved training examples`)

    if (!examples || examples.length < 10) {
      // Need at least 10 examples for fine-tuning
      await supabase
        .from('fine_tuning_jobs')
        .update({ 
          status: 'failed',
          error_message: `Insufficient training examples: ${examples?.length || 0}. Need at least 10.`,
          completed_at: new Date().toISOString()
        })
        .eq('id', job.id)

      return new Response(
        JSON.stringify({ 
          error: 'Insufficient training examples',
          count: examples?.length || 0
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      )
    }

    // Step 4: Format examples for OpenAI fine-tuning
    const trainingData = examples.map(example => ({
      messages: [
        {
          role: "system",
          content: example.system_prompt || "You are EquipIQ, an expert AI assistant for tanning salon equipment troubleshooting."
        },
        {
          role: "user",
          content: example.user_prompt
        },
        {
          role: "assistant",
          content: example.assistant_response
        }
      ]
    }))

    // Step 5: Create JSONL file content
    const jsonlContent = trainingData
      .map(item => JSON.stringify(item))
      .join('\n')

    // Step 6: Upload training file to OpenAI
    const formData = new FormData()
    const blob = new Blob([jsonlContent], { type: 'application/jsonl' })
    formData.append('file', blob, 'training_data.jsonl')
    formData.append('purpose', 'fine-tune')

    const uploadResponse = await fetch('https://api.openai.com/v1/files', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
      },
      body: formData
    })

    if (!uploadResponse.ok) {
      const error = await uploadResponse.text()
      throw new Error(`Failed to upload training file: ${error}`)
    }

    const uploadedFile = await uploadResponse.json()
    console.log(`Uploaded training file: ${uploadedFile.id}`)

    // Step 7: Create fine-tuning job
    const fineTuneResponse = await fetch('https://api.openai.com/v1/fine_tuning/jobs', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        training_file: uploadedFile.id,
        model: job.base_model || 'gpt-3.5-turbo',
        suffix: `equipiq-${job.id.slice(0, 8)}`,
        hyperparameters: {
          n_epochs: 3,
        }
      })
    })

    if (!fineTuneResponse.ok) {
      const error = await fineTuneResponse.text()
      throw new Error(`Failed to create fine-tuning job: ${error}`)
    }

    const fineTuneJob = await fineTuneResponse.json()
    console.log(`Created OpenAI fine-tuning job: ${fineTuneJob.id}`)

    // Step 8: Update job with OpenAI job ID
    await supabase
      .from('fine_tuning_jobs')
      .update({ 
        status: 'running',
        openai_job_id: fineTuneJob.id,
        training_examples_count: examples.length
      })
      .eq('id', job.id)

    // Step 9: Create a scheduled job to check completion
    // Note: In production, you'd use a proper job queue or webhook
    // For now, we'll return the job ID and let another function check status

    return new Response(
      JSON.stringify({ 
        message: 'Fine-tuning job started',
        job_id: job.id,
        openai_job_id: fineTuneJob.id,
        examples_count: examples.length
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('Error processing fine-tuning job:', error)
    
    // Try to update job status to failed if we have a job ID
    if (error.job_id) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      const supabase = createClient(supabaseUrl, supabaseServiceKey)
      
      await supabase
        .from('fine_tuning_jobs')
        .update({ 
          status: 'failed',
          error_message: error.message,
          completed_at: new Date().toISOString()
        })
        .eq('id', error.job_id)
    }
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})