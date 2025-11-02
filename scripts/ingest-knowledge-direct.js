/**
 * Knowledge Base Data Ingestion Script (Direct Postgres Connection)
 *
 * This script ingests troubleshooting conversations from the Limble dataset
 * into the EquipIQ knowledge_chunks table using direct Postgres connection.
 *
 * Usage: node scripts/ingest-knowledge-direct.js
 */

import pg from 'pg';
const { Client } = pg;
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env.local') });

// Configuration
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:K8pzVGCcE96oC1Ff@db.enpqzoeohonguemzyifo.supabase.co:5432/postgres';
const OPENAI_API_KEY = process.env.VITE_OPENAI_API_KEY;
const BATCH_SIZE = 10;
const SKIP_EMBEDDINGS = process.env.SKIP_EMBEDDINGS === 'true' || !OPENAI_API_KEY;

// Equipment type mappings based on keywords
const EQUIPMENT_KEYWORDS = {
  'VersaSpa Pro': ['versaspa', 'versa spa', 'versa pro', 'versa'],
  'Norvell Auto Revolution': ['norvell', 'auto revolution'],
  'Affinity': ['affinity', 'ergoline affinity'],
  'Prestige': ['prestige', 'ergoline prestige'],
  'MegaSun': ['megasun'],
  'Sybaritic Hydration': ['sybaritic', 'hydration station'],
  'Beauty Angel': ['beauty angel'],
  'Generic Spray Booth': ['spray', 'spray booth', 'spray tan'],
  'Generic Tanning Bed': ['tanning bed', 'uv bed', 'bed'],
  'HydraFacial': ['hydration', 'hydrafacial', 'spa'],
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

  return 'General Equipment'; // Default for unclassified content
}

/**
 * Generate embedding using OpenAI API
 */
async function generateEmbedding(text) {
  if (SKIP_EMBEDDINGS) {
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
      const errorText = await response.text();
      console.error(`OpenAI API error (${response.status}):`, errorText);
      return null;
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
async function getEquipmentTypeId(client, typeName) {
  try {
    // First try to find existing equipment type
    const selectResult = await client.query(
      'SELECT id FROM equipment_types WHERE name = $1',
      [typeName]
    );

    if (selectResult.rows.length > 0) {
      return selectResult.rows[0].id;
    }

    // Create new equipment type if it doesn't exist
    const insertResult = await client.query(
      'INSERT INTO equipment_types (name, description) VALUES ($1, $2) RETURNING id',
      [typeName, `Equipment type: ${typeName}`]
    );

    console.log(`  Created new equipment type: ${typeName}`);
    return insertResult.rows[0].id;
  } catch (error) {
    console.error(`Error with equipment type ${typeName}:`, error.message);
    return null;
  }
}

/**
 * Process a single conversation and create knowledge chunk
 */
async function processConversation(client, conversation, index) {
  const messages = conversation.messages;

  // Extract user query and assistant response
  const userMessage = messages.find(m => m.role === 'user');
  const assistantMessage = messages.find(m => m.role === 'assistant');

  if (!userMessage || !assistantMessage) {
    return { success: false, reason: 'Missing user or assistant message' };
  }

  // Combine user question and assistant answer for better context
  const fullContent = `Question: ${userMessage.content}\n\nAnswer: ${assistantMessage.content}`;

  // Extract equipment type
  const equipmentTypeName = extractEquipmentType(fullContent);
  const equipmentTypeId = await getEquipmentTypeId(client, equipmentTypeName);

  if (!equipmentTypeId) {
    return { success: false, reason: 'Could not create equipment type' };
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

  // Insert into database
  try {
    const query = `
      INSERT INTO knowledge_chunks (equipment_type_id, content, embedding, metadata, source, chunk_type)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id
    `;

    const values = [
      equipmentTypeId,
      fullContent,
      embedding ? `[${embedding.join(',')}]` : null,
      JSON.stringify(metadata),
      'limble_troubleshooting_conversations',
      'resolved_issue'
    ];

    await client.query(query, values);
    return { success: true, equipment_type: equipmentTypeName };
  } catch (error) {
    console.error(`Error inserting chunk ${index}:`, error.message);
    return { success: false, reason: error.message };
  }
}

/**
 * Main ingestion function
 */
async function ingestKnowledgeData() {
  console.log('=== EquipIQ Knowledge Base Ingestion (Direct DB) ===\n');

  if (SKIP_EMBEDDINGS) {
    console.log('⚠️  SKIP_EMBEDDINGS=true - Embeddings will not be generated');
    console.log('   You can add embeddings later with a separate script\n');
  }

  // Connect to database
  const client = new Client({ connectionString: DATABASE_URL });

  try {
    await client.connect();
    console.log('✓ Connected to database\n');
  } catch (error) {
    console.error('Failed to connect to database:', error.message);
    process.exit(1);
  }

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
    await client.end();
    process.exit(1);
  }

  // Parse conversations
  const conversations = lines.map(line => JSON.parse(line));

  // Process conversations
  let totalProcessed = 0;
  let totalInserted = 0;
  let totalErrors = 0;
  const equipmentTypeCounts = {};

  for (let i = 0; i < conversations.length; i++) {
    const conv = conversations[i];

    if (i % 10 === 0 && i > 0) {
      console.log(`Progress: ${i}/${conversations.length} conversations processed...`);
    }

    const result = await processConversation(client, conv, i);
    totalProcessed++;

    if (result.success) {
      totalInserted++;
      equipmentTypeCounts[result.equipment_type] = (equipmentTypeCounts[result.equipment_type] || 0) + 1;
    } else {
      totalErrors++;
      if (totalErrors <= 5) {
        console.log(`  ⚠️  Conversation ${i}: ${result.reason}`);
      }
    }

    // Rate limiting for OpenAI API
    if (!SKIP_EMBEDDINGS && i % 10 === 0 && i > 0) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  await client.end();

  console.log('\n=== Ingestion Complete ===');
  console.log(`Total conversations processed: ${totalProcessed}`);
  console.log(`Total chunks inserted: ${totalInserted}`);
  console.log(`Total errors: ${totalErrors}`);

  console.log('\n=== Equipment Type Distribution ===');
  Object.entries(equipmentTypeCounts)
    .sort((a, b) => b[1] - a[1])
    .forEach(([type, count]) => {
      console.log(`  ${type}: ${count} chunks`);
    });

  console.log('\n=== Next Steps ===');
  console.log('1. Verify data in Supabase dashboard');
  console.log('2. Test knowledge base queries');
  if (SKIP_EMBEDDINGS) {
    console.log('3. ⚠️  Run embedding generation script to add vector search capability');
  }
}

// Run the ingestion
ingestKnowledgeData().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
