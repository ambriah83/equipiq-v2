/**
 * Combined Knowledge Base Ingestion Script
 *
 * Ingests BOTH:
 * 1. Limble troubleshooting conversations (650 Q&A pairs)
 * 2. Basecamp troubleshooting chat (837 Q&A pairs)
 *
 * Total: ~1,487 knowledge chunks
 *
 * Usage: node scripts/ingest-all-knowledge.js
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
  'Beauty Angel': ['beauty angel', 'ba 7200'],
  'Generic Spray Booth': ['spray booth', 'mystic tan'],
  'Generic Tanning Bed': ['tanning bed', 'uv bed', 'bed'],
  'HydraFacial': ['hydrafacial', 'spa'],
  'LED Lighting': ['led strip', 'led', 'lamp', 'bulb'],
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

  return 'General Equipment';
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
        input: text.substring(0, 8000), // Limit to 8K chars for API
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
    const selectResult = await client.query(
      'SELECT id FROM equipment_types WHERE name = $1',
      [typeName]
    );

    if (selectResult.rows.length > 0) {
      return selectResult.rows[0].id;
    }

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
 * Process Limble conversation
 */
async function processLimbleConversation(client, conversation, index) {
  const messages = conversation.messages;
  const userMessage = messages.find(m => m.role === 'user');
  const assistantMessage = messages.find(m => m.role === 'assistant');

  if (!userMessage || !assistantMessage) {
    return { success: false, reason: 'Missing user or assistant message' };
  }

  const fullContent = `Question: ${userMessage.content}\n\nAnswer: ${assistantMessage.content}`;
  const equipmentTypeName = extractEquipmentType(fullContent);
  const equipmentTypeId = await getEquipmentTypeId(client, equipmentTypeName);

  if (!equipmentTypeId) {
    return { success: false, reason: 'Could not create equipment type' };
  }

  const embedding = await generateEmbedding(fullContent);

  const metadata = {
    user_query: userMessage.content,
    assistant_response: assistantMessage.content,
    equipment_type: equipmentTypeName,
    ingestion_date: new Date().toISOString(),
    source_file: 'fine-tuning-dataset-2025-07-18T18-51-43-964Z.jsonl',
    conversation_index: index,
  };

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
    console.error(`Error inserting Limble chunk ${index}:`, error.message);
    return { success: false, reason: error.message };
  }
}

/**
 * Process Basecamp Q&A pair
 */
async function processBasecampQA(client, qa, index) {
  const fullContent = `Question: ${qa.question}\n\nAnswer: ${qa.answer}`;
  const equipmentTypeName = extractEquipmentType(fullContent);
  const equipmentTypeId = await getEquipmentTypeId(client, equipmentTypeName);

  if (!equipmentTypeId) {
    return { success: false, reason: 'Could not create equipment type' };
  }

  const embedding = await generateEmbedding(fullContent);

  const metadata = {
    user_query: qa.question,
    assistant_response: qa.answer,
    equipment_type: equipmentTypeName,
    ingestion_date: new Date().toISOString(),
    source_file: 'basecamp-qa-pairs.json',
    question_author: qa.question_author,
    answer_author: qa.answer_author,
    question_timestamp: qa.question_timestamp,
    answer_timestamp: qa.answer_timestamp,
    conversation_index: index,
  };

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
      'basecamp_troubleshooting_chat',
      'staff_conversation'
    ];

    await client.query(query, values);
    return { success: true, equipment_type: equipmentTypeName };
  } catch (error) {
    console.error(`Error inserting Basecamp chunk ${index}:`, error.message);
    return { success: false, reason: error.message };
  }
}

/**
 * Main ingestion function
 */
async function ingestAllKnowledge() {
  console.log('=== EquipIQ Combined Knowledge Base Ingestion ===\n');

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

  let totalInserted = 0;
  let totalErrors = 0;
  const equipmentTypeCounts = {};

  // === Process Limble Data ===
  console.log('=== Processing Limble Conversations ===');
  const limblePath = join(__dirname, '..', '..', 'Development-Projects', 'Maintenance EquipIQ', 'Maint CHATGPT BOT ANALYSIS', 'fine-tuning-dataset-2025-07-18T18-51-43-964Z.jsonl');

  try {
    const limbleContent = readFileSync(limblePath, 'utf-8');
    const limbleLines = limbleContent.trim().split('\n');
    const limbleConversations = limbleLines.map(line => JSON.parse(line));

    console.log(`Found ${limbleConversations.length} Limble conversations\n`);

    for (let i = 0; i < limbleConversations.length; i++) {
      if (i % 50 === 0 && i > 0) {
        console.log(`  Progress: ${i}/${limbleConversations.length} processed...`);
      }

      const result = await processLimbleConversation(client, limbleConversations[i], i);

      if (result.success) {
        totalInserted++;
        equipmentTypeCounts[result.equipment_type] = (equipmentTypeCounts[result.equipment_type] || 0) + 1;
      } else {
        totalErrors++;
      }

      // Rate limiting
      if (!SKIP_EMBEDDINGS && i % 10 === 0 && i > 0) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.log(`✓ Limble: ${totalInserted} inserted\n`);
  } catch (error) {
    console.error('Error processing Limble data:', error.message);
  }

  // === Process Basecamp Data ===
  console.log('=== Processing Basecamp Troubleshooting Chat ===');
  const basecampPath = join(__dirname, '..', 'Troubleshooting Chat', 'basecamp-qa-pairs.json');

  try {
    const basecampContent = readFileSync(basecampPath, 'utf-8');
    const basecampQAs = JSON.parse(basecampContent);

    console.log(`Found ${basecampQAs.length} Basecamp Q&A pairs\n`);

    const basecampStart = totalInserted;

    for (let i = 0; i < basecampQAs.length; i++) {
      if (i % 50 === 0 && i > 0) {
        console.log(`  Progress: ${i}/${basecampQAs.length} processed...`);
      }

      const result = await processBasecampQA(client, basecampQAs[i], i);

      if (result.success) {
        totalInserted++;
        equipmentTypeCounts[result.equipment_type] = (equipmentTypeCounts[result.equipment_type] || 0) + 1;
      } else {
        totalErrors++;
      }

      // Rate limiting
      if (!SKIP_EMBEDDINGS && i % 10 === 0 && i > 0) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.log(`✓ Basecamp: ${totalInserted - basecampStart} inserted\n`);
  } catch (error) {
    console.error('Error processing Basecamp data:', error.message);
  }

  await client.end();

  console.log('\n=== Ingestion Complete ===');
  console.log(`Total chunks inserted: ${totalInserted}`);
  console.log(`Total errors: ${totalErrors}`);

  console.log('\n=== Equipment Type Distribution ===');
  Object.entries(equipmentTypeCounts)
    .sort((a, b) => b[1] - a[1])
    .forEach(([type, count]) => {
      console.log(`  ${type}: ${count} chunks`);
    });

  console.log('\n=== Data Sources ===');
  console.log('  Limble conversations: AI-generated troubleshooting Q&A');
  console.log('  Basecamp chat: Real staff-to-staff troubleshooting discussions');

  console.log('\n=== Next Steps ===');
  console.log('1. Verify data in Supabase dashboard');
  console.log('2. Test knowledge base queries');
  console.log('3. Deploy edge functions for AI search');
  if (SKIP_EMBEDDINGS) {
    console.log('4. ⚠️  Run embedding generation script to enable vector search');
  }
}

// Run the ingestion
ingestAllKnowledge().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
