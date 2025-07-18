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

    // Step 1: Get all running fine-tuning jobs
    const { data: runningJobs, error: jobError } = await supabase
      .from('fine_tuning_jobs')
      .select('*')
      .eq('status', 'running')
      .not('openai_job_id', 'is', null)

    if (jobError) throw jobError

    if (!runningJobs || runningJobs.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No running jobs to check' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      )
    }

    const results = []

    // Step 2: Check each job's status with OpenAI
    for (const job of runningJobs) {
      try {
        const statusResponse = await fetch(
          `https://api.openai.com/v1/fine_tuning/jobs/${job.openai_job_id}`,
          {
            headers: {
              'Authorization': `Bearer ${openaiKey}`,
            }
          }
        )

        if (!statusResponse.ok) {
          console.error(`Failed to check status for job ${job.id}`)
          continue
        }

        const openaiJob = await statusResponse.json()
        console.log(`Job ${job.id} status: ${openaiJob.status}`)

        // Step 3: Update job based on OpenAI status
        if (openaiJob.status === 'succeeded') {
          // Job completed successfully
          const fineTunedModel = openaiJob.fine_tuned_model
          
          // Update the job status
          await supabase
            .from('fine_tuning_jobs')
            .update({ 
              status: 'completed',
              completed_at: new Date().toISOString()
            })
            .eq('id', job.id)

          // Create a new AI model record
          const { data: newModel, error: modelError } = await supabase
            .from('ai_models')
            .insert({
              fine_tuning_job_id: job.id,
              openai_model_id: fineTunedModel,
              name: `EquipIQ Fine-tuned ${new Date().toLocaleDateString()}`,
              is_live: false // Will be activated after evaluation
            })
            .select()
            .single()

          if (modelError) {
            console.error('Failed to create AI model record:', modelError)
          } else {
            results.push({
              job_id: job.id,
              status: 'completed',
              model_id: newModel.id,
              openai_model: fineTunedModel
            })
          }

        } else if (openaiJob.status === 'failed') {
          // Job failed
          await supabase
            .from('fine_tuning_jobs')
            .update({ 
              status: 'failed',
              error_message: openaiJob.error?.message || 'Unknown error',
              completed_at: new Date().toISOString()
            })
            .eq('id', job.id)

          results.push({
            job_id: job.id,
            status: 'failed',
            error: openaiJob.error?.message
          })

        } else if (openaiJob.status === 'cancelled') {
          // Job was cancelled
          await supabase
            .from('fine_tuning_jobs')
            .update({ 
              status: 'failed',
              error_message: 'Job was cancelled',
              completed_at: new Date().toISOString()
            })
            .eq('id', job.id)

          results.push({
            job_id: job.id,
            status: 'cancelled'
          })

        } else {
          // Still running
          results.push({
            job_id: job.id,
            status: openaiJob.status,
            trained_tokens: openaiJob.trained_tokens,
            training_step: openaiJob.training_step
          })
        }

      } catch (error) {
        console.error(`Error checking job ${job.id}:`, error)
        results.push({
          job_id: job.id,
          error: error.message
        })
      }
    }

    return new Response(
      JSON.stringify({ 
        message: `Checked ${runningJobs.length} jobs`,
        results: results
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('Error checking fine-tuning status:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})