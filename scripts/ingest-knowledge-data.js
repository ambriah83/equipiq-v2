/**
 * Knowledge Base Data Ingestion Script
 *
 * This script ingests troubleshooting conversations from the Limble dataset
 * into the EquipIQ knowledge_chunks table with embeddings.
 *
 * Usage: node scripts/ingest-knowledge-data.js
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://enpqzoeohonguemzyifo.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const OPENAI_API_KEY = process.env.VITE_OPENAI_API_KEY;
const BATCH_SIZE = 10;

// Initialize Supabase client with service key for admin operations
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Equipment type mappings based on keywords
const EQUIPMENT_KEYWORDS = {
  'versaspa': ['versaspa', 'versa spa', 'versa pro', 'versa'],
  'norvell': ['norvell', 'auto revolution'],
  'affinity': ['affinity', 'ergoline affinity'],
  'prestige': ['prestige', 'ergoline prestige'],
  'megasun': ['megasun'],
  'sybaritic': ['sybaritic', 'hydration'],
  'beauty_angel': ['beauty angel'],
  'spray_tan': ['spray', 'spray booth', 'spray tan'],
  'tanning_bed': ['tanning bed', 'uv bed', 'bed'],
  'hydration': ['hydration', 'hydrafacial', 'spa'],
};

/**
 * Extract equipment type from conversation content
 */
function extractEquipmentType(content) {
  const lowerContent = content.toLowerCase();

  for (const [equipmentType, keywords] of Object.entries(EQUIPMENT_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lowerContent.includes(keyword)) {
        return equipmentType;
      }
    }
  }

  return 'general'; // Default for unclassified content
}

/**
 * Generate embedding using OpenAI API
 */
async function generateEmbedding(text) {
  if (!OPENAI_API_KEY) {
    console.warn('OpenAI API key not found. Skipping embeddings.');
    return null;
  }

  try {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: text,
        model: 'text-embedding-ada-002',
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    return data.data[0].embedding;
  } catch (error) {
    console.error('Error generating embedding:', error.message);
    return null;
  }
}

/**
 * Get or create equipment type ID
 */
async function getEquipmentTypeId(typeName) {
  // First try to find existing equipment type
  const { data: existing, error: searchError } = await supabase
    .from('equipment_types')
    .select('id')
    .eq('name', typeName)
    .single();

  if (existing) {
    return existing.id;
  }

  // Create new equipment type if it doesn't exist
  const { data: newType, error: createError } = await supabase
    .from('equipment_types')
    .insert({
      name: typeName,
      description: `Equipment type: ${typeName}`,
    })
    .select('id')
    .single();

  if (createError) {
    console.error(`Error creating equipment type ${typeName}:`, createError);
    return null;
  }

  console.log(`Created new equipment type: ${typeName}`);
  return newType.id;
}

/**
 * Process a single conversation and create knowledge chunks
 */
async function processConversation(conversation, index) {
  const messages = conversation.messages;

  // Extract user query and assistant response
  const userMessage = messages.find(m => m.role === 'user');
  const assistantMessage = messages.find(m => m.role === 'assistant');

  if (!userMessage || !assistantMessage) {
    console.log(`Skipping conversation ${index}: Missing user or assistant message`);
    return null;
  }

  // Combine user question and assistant answer for better context
  const fullContent = `Question: ${userMessage.content}\n\nAnswer: ${assistantMessage.content}`;

  // Extract equipment type
  const equipmentTypeName = extractEquipmentType(fullContent);
  const equipmentTypeId = await getEquipmentTypeId(equipmentTypeName);

  if (!equipmentTypeId) {
    console.log(`Skipping conversation ${index}: Could not create equipment type`);
    return null;
  }

  // Generate embedding
  const embedding = await generateEmbedding(fullContent);

  // Create metadata
  const metadata = {
    user_query: userMessage.content,
    assistant_response: assistantMessage.content,
    equipment_type: equipmentTypeName,
    ingestion_date: new Date().toISOString(),
    source_file: 'fine-tuning-dataset-2025-07-18T18-51-43-964Z.jsonl',
    conversation_index: index,
  };

  return {
    equipment_type_id: equipmentTypeId,
    content: fullContent,
    embedding: embedding,
    metadata: metadata,
    source: 'limble_troubleshooting_conversations',
    chunk_type: 'resolved_issue',
  };
}

/**
 * Insert knowledge chunks in batches
 */
async function insertChunks(chunks) {
  const validChunks = chunks.filter(chunk => chunk !== null);

  if (validChunks.length === 0) {
    console.log('No valid chunks to insert');
    return { success: 0, errors: 0 };
  }

  const { data, error } = await supabase
    .from('knowledge_chunks')
    .insert(validChunks)
    .select('id');

  if (error) {
    console.error('Error inserting chunks:', error);
    return { success: 0, errors: validChunks.length };
  }

  return { success: data.length, errors: 0 };
}

/**
 * Main ingestion function
 */
async function ingestKnowledgeData() {
  console.log('=== EquipIQ Knowledge Base Ingestion ===\n');

  // Load the JSONL file
  const dataPath = join(__dirname, '..', '..', 'Development-Projects', 'Maintenance EquipIQ', 'Maint CHATGPT BOT ANALYSIS', 'fine-tuning-dataset-2025-07-18T18-51-43-964Z.jsonl');

  console.log(`Reading data from: ${dataPath}`);

  let lines;
  try {
    const fileContent = readFileSync(dataPath, 'utf-8');
    lines = fileContent.trim().split('\n');
    console.log(`Found ${lines.length} conversations\n`);
  } catch (error) {
    console.error('Error reading file:', error.message);
    process.exit(1);
  }

  // Parse conversations
  const conversations = lines.map(line => JSON.parse(line));

  // Process in batches
  let totalProcessed = 0;
  let totalInserted = 0;
  let totalErrors = 0;

  for (let i = 0; i < conversations.length; i += BATCH_SIZE) {
    const batch = conversations.slice(i, i + BATCH_SIZE);
    console.log(`Processing batch ${Math.floor(i / BATCH_SIZE) + 1} (conversations ${i + 1}-${Math.min(i + BATCH_SIZE, conversations.length)})...`);

    // Process conversations in parallel within batch
    const chunkPromises = batch.map((conv, idx) => processConversation(conv, i + idx));
    const chunks = await Promise.all(chunkPromises);

    // Insert batch
    const result = await insertChunks(chunks);
    totalInserted += result.success;
    totalErrors += result.errors;
    totalProcessed += batch.length;

    console.log(`  ✓ Processed: ${batch.length}, Inserted: ${result.success}, Errors: ${result.errors}`);

    // Rate limiting for OpenAI API
    if (OPENAI_API_KEY && i + BATCH_SIZE < conversations.length) {
      console.log('  Waiting 2 seconds to respect rate limits...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  console.log('\n=== Ingestion Complete ===');
  console.log(`Total conversations processed: ${totalProcessed}`);
  console.log(`Total chunks inserted: ${totalInserted}`);
  console.log(`Total errors: ${totalErrors}`);
  console.log('\nNext steps:');
  console.log('1. Verify data in Supabase dashboard');
  console.log('2. Test knowledge base queries');
  console.log('3. Review equipment type classifications');
}

// Run the ingestion
ingestKnowledgeData().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
