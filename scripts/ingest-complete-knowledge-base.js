/**
 * Complete Knowledge Base Ingestion Script
 *
 * Processes ALL data sources:
 * 1. Troubleshooting Chat (Basecamp) - 837 Q&A pairs
 * 2. Maint Chat (Limble) - 650 Q&A pairs
 * 3. Equipment Spec Sheets - 38 PDFs/DOCX
 * 4. VersaSpa Troubleshooting Guides - 4 DOCX
 * 5. TMAX Timer Guides - 5 PDF/DOCX
 *
 * Total: ~2,000-2,700 knowledge chunks
 *
 * Usage: node scripts/ingest-complete-knowledge-base.js
 */

import pg from 'pg';
const { Client } = pg;
import { readFileSync, readdirSync } from 'fs';
import { join, dirname, extname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import pdf from 'pdf-parse';
import mammoth from 'mammoth';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env.local') });

// Configuration
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:K8pzVGCcE96oC1Ff@db.enpqzoeohonguemzyifo.supabase.co:5432/postgres';
const OPENAI_API_KEY = process.env.VITE_OPENAI_API_KEY;
const SKIP_EMBEDDINGS = process.env.SKIP_EMBEDDINGS === 'true' || !OPENAI_API_KEY;

// Equipment type mappings
const EQUIPMENT_KEYWORDS = {
  'VersaSpa Pro': ['versaspa', 'versa spa', 'versa pro', 'versa'],
  'Norvell Auto Revolution': ['norvell', 'auto revolution'],
  'Affinity': ['affinity'],
  'Prestige': ['prestige'],
  'MegaSun': ['megasun', 'alpha'],
  'Sybaritic Hydration': ['sybaritic', 'skin wellness', 'cocoon aqua'],
  'Beauty Angel': ['beauty angel', 'ba 7200', 'rvt 30'],
  'Mystic Tan': ['mystic tan', 'mystic', 'spray booth'],
  'TMAX Timer': ['tmax', 'timer control', 'wall timer', 'manager pro', 'touch'],
  'Sunrise': ['sunrise'],
  'Vitality': ['vitality'],
  'Inspiration': ['inspiration'],
  'Open Sun': ['open sun'],
  'Sun Angel': ['sun angel'],
  'Passion': ['passion'],
  'Spirit': ['spirit'],
  'Revive': ['revive', 'red light', 'red-light'],
  'Wellsystem': ['wellsystem', 'wave'],
  'Cocoon Fitness': ['cocoon fitness'],
  'P9 HybridSun': ['p9', 'hybridsun'],
  'Generic Tanning Bed': ['tanning bed', 'uv bed'],
  'LED Lighting': ['led strip', 'lamp', 'bulb'],
};

// Stats tracking
const stats = {
  totalProcessed: 0,
  totalInserted: 0,
  totalErrors: 0,
  bySource: {},
  byEquipmentType: {},
};

/**
 * Extract equipment type from content
 */
function extractEquipmentType(content, filename = '') {
  const searchText = (content + ' ' + filename).toLowerCase();

  for (const [equipmentType, keywords] of Object.entries(EQUIPMENT_KEYWORDS)) {
    for (const keyword of keywords) {
      if (searchText.includes(keyword)) {
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
  if (SKIP_EMBEDDINGS) return null;

  try {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: text.substring(0, 8000),
        model: 'text-embedding-ada-002',
      }),
    });

    if (!response.ok) {
      console.error(`OpenAI API error: ${response.status}`);
      return null;
    }

    const data = await response.json();
    return data.data[0].embedding;
  } catch (error) {
    console.error('Embedding generation error:', error.message);
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

    console.log(`  Created equipment type: ${typeName}`);
    return insertResult.rows[0].id;
  } catch (error) {
    console.error(`Error with equipment type ${typeName}:`, error.message);
    return null;
  }
}

/**
 * Insert knowledge chunk
 */
async function insertKnowledgeChunk(client, {
  content,
  equipmentType,
  source,
  chunkType,
  metadata,
  filename
}) {
  const equipmentTypeId = await getEquipmentTypeId(client, equipmentType);
  if (!equipmentTypeId) return false;

  const embedding = await generateEmbedding(content);

  try {
    await client.query(
      `INSERT INTO knowledge_chunks (equipment_type_id, content, embedding, metadata, source, chunk_type)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        equipmentTypeId,
        content,
        embedding ? `[${embedding.join(',')}]` : null,
        JSON.stringify({ ...metadata, original_filename: filename }),
        source,
        chunkType
      ]
    );

    stats.totalInserted++;
    stats.bySource[source] = (stats.bySource[source] || 0) + 1;
    stats.byEquipmentType[equipmentType] = (stats.byEquipmentType[equipmentType] || 0) + 1;
    return true;
  } catch (error) {
    console.error(`Insert error:`, error.message);
    stats.totalErrors++;
    return false;
  }
}

/**
 * Extract text from PDF
 */
async function extractPDF(filePath) {
  try {
    const dataBuffer = readFileSync(filePath);
    const data = await pdf(dataBuffer);
    return data.text;
  } catch (error) {
    console.error(`PDF extraction error (${filePath}):`, error.message);
    return null;
  }
}

/**
 * Extract text from DOCX
 */
async function extractDOCX(filePath) {
  try {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value;
  } catch (error) {
    console.error(`DOCX extraction error (${filePath}):`, error.message);
    return null;
  }
}

/**
 * Chunk text into smaller pieces
 */
function chunkText(text, maxChars = 3000) {
  const chunks = [];
  const paragraphs = text.split(/\n\n+/);
  let currentChunk = '';

  for (const para of paragraphs) {
    if ((currentChunk + para).length > maxChars && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      currentChunk = para;
    } else {
      currentChunk += '\n\n' + para;
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

/**
 * Process Troubleshooting Chat
 */
async function processTroubleshootingChat(client) {
  console.log('\n=== Processing Troubleshooting Chat (Basecamp) ===');
  const filePath = join(__dirname, '..', 'Troubleshooting Chat', 'basecamp-qa-pairs.json');

  try {
    const qaPairs = JSON.parse(readFileSync(filePath, 'utf-8'));
    console.log(`Found ${qaPairs.length} Q&A pairs`);

    for (let i = 0; i < qaPairs.length; i++) {
      const qa = qaPairs[i];
      const content = `Question: ${qa.question}\n\nAnswer: ${qa.answer}`;
      const equipmentType = extractEquipmentType(content);

      await insertKnowledgeChunk(client, {
        content,
        equipmentType,
        source: 'basecamp_troubleshooting_chat',
        chunkType: 'staff_conversation',
        metadata: {
          question_author: qa.question_author,
          answer_author: qa.answer_author,
        },
        filename: 'basecamp-qa-pairs.json'
      });

      if (i % 50 === 0 && i > 0) {
        console.log(`  Progress: ${i}/${qaPairs.length}`);
        if (!SKIP_EMBEDDINGS) await new Promise(r => setTimeout(r, 1000));
      }
    }

    console.log(`✓ Basecamp chat: ${stats.bySource['basecamp_troubleshooting_chat']} chunks`);
  } catch (error) {
    console.error('Error processing Basecamp chat:', error.message);
  }
}

/**
 * Process Limble/Maint Chat
 */
async function processMaintChat(client) {
  console.log('\n=== Processing Maint Chat (Limble) ===');
  const filePath = join(__dirname, '..', '..', 'Development-Projects', 'Maintenance EquipIQ', 'Maint CHATGPT BOT ANALYSIS', 'fine-tuning-dataset-2025-07-18T18-51-43-964Z.jsonl');

  try {
    const lines = readFileSync(filePath, 'utf-8').trim().split('\n');
    const conversations = lines.map(line => JSON.parse(line));
    console.log(`Found ${conversations.length} conversations`);

    for (let i = 0; i < conversations.length; i++) {
      const conv = conversations[i];
      const userMsg = conv.messages.find(m => m.role === 'user');
      const assistantMsg = conv.messages.find(m => m.role === 'assistant');

      if (!userMsg || !assistantMsg) continue;

      const content = `Question: ${userMsg.content}\n\nAnswer: ${assistantMsg.content}`;
      const equipmentType = extractEquipmentType(content);

      await insertKnowledgeChunk(client, {
        content,
        equipmentType,
        source: 'limble_troubleshooting_conversations',
        chunkType: 'resolved_issue',
        metadata: {
          user_query: userMsg.content,
          assistant_response: assistantMsg.content,
        },
        filename: 'fine-tuning-dataset.jsonl'
      });

      if (i % 50 === 0 && i > 0) {
        console.log(`  Progress: ${i}/${conversations.length}`);
        if (!SKIP_EMBEDDINGS) await new Promise(r => setTimeout(r, 1000));
      }
    }

    console.log(`✓ Limble chat: ${stats.bySource['limble_troubleshooting_conversations']} chunks`);
  } catch (error) {
    console.error('Error processing Limble chat:', error.message);
  }
}

/**
 * Process Equipment Documents
 */
async function processEquipmentDocuments(client) {
  console.log('\n=== Processing Equipment Documents ===');

  const docSets = [
    {
      name: 'Equipment Spec Sheets',
      path: join(__dirname, '..', 'Maint CHATGPT BOT ANALYSIS', 'Equipment Spec Sheets'),
      source: 'equipment_spec_sheet',
      chunkType: 'specification'
    },
    {
      name: 'VersaSpa Troubleshooting',
      path: join(__dirname, '..', 'Versa', 'Versa Troubleshooting'),
      source: 'versaspa_troubleshooting_guide',
      chunkType: 'troubleshooting_guide'
    },
    {
      name: 'TMAX Guides',
      path: join(__dirname, '..', 'TMAX'),
      source: 'tmax_timer_guide',
      chunkType: 'user_manual'
    }
  ];

  for (const docSet of docSets) {
    console.log(`\n  Processing: ${docSet.name}`);

    try {
      const files = readdirSync(docSet.path);
      let processed = 0;

      for (const file of files) {
        const ext = extname(file).toLowerCase();
        if (!['.pdf', '.docx'].includes(ext)) continue;

        const filePath = join(docSet.path, file);
        console.log(`    Extracting: ${file}`);

        let text = null;
        if (ext === '.pdf') {
          text = await extractPDF(filePath);
        } else if (ext === '.docx') {
          text = await extractDOCX(filePath);
        }

        if (!text || text.length < 100) {
          console.log(`      ⚠️ Skipped (no text extracted)`);
          continue;
        }

        const equipmentType = extractEquipmentType(text, file);
        const chunks = chunkText(text);

        for (let i = 0; i < chunks.length; i++) {
          await insertKnowledgeChunk(client, {
            content: chunks[i],
            equipmentType,
            source: docSet.source,
            chunkType: docSet.chunkType,
            metadata: {
              chunk_index: i,
              total_chunks: chunks.length,
            },
            filename: file
          });
        }

        processed++;
        console.log(`      ✓ ${chunks.length} chunks created`);

        if (!SKIP_EMBEDDINGS && processed % 3 === 0) {
          await new Promise(r => setTimeout(r, 2000));
        }
      }

      console.log(`  ✓ ${docSet.name}: ${processed} files processed`);
    } catch (error) {
      console.error(`  Error processing ${docSet.name}:`, error.message);
    }
  }
}

/**
 * Main ingestion function
 */
async function main() {
  console.log('╔════════════════════════════════════════════════╗');
  console.log('║  EquipIQ Complete Knowledge Base Ingestion    ║');
  console.log('╚════════════════════════════════════════════════╝\n');

  if (SKIP_EMBEDDINGS) {
    console.log('⚠️  SKIP_EMBEDDINGS=true - No embeddings will be generated\n');
  }

  // Connect to database
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✓ Connected to database\n');
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  }

  // Process all sources
  await processTroubleshootingChat(client);
  await processMaintChat(client);
  await processEquipmentDocuments(client);

  await client.end();

  // Final report
  console.log('\n╔════════════════════════════════════════════════╗');
  console.log('║             Ingestion Complete!                 ║');
  console.log('╚════════════════════════════════════════════════╝\n');

  console.log('📊 Summary:');
  console.log(`  Total chunks inserted: ${stats.totalInserted}`);
  console.log(`  Total errors: ${stats.totalErrors}\n`);

  console.log('📁 By Source:');
  Object.entries(stats.bySource)
    .sort((a, b) => b[1] - a[1])
    .forEach(([source, count]) => {
      console.log(`  ${source}: ${count} chunks`);
    });

  console.log('\n🔧 By Equipment Type:');
  Object.entries(stats.byEquipmentType)
    .sort((a, b) => b[1] - a[1])
    .forEach(([type, count]) => {
      console.log(`  ${type}: ${count} chunks`);
    });

  console.log('\n✅ Next Steps:');
  console.log('  1. Verify data in Supabase dashboard');
  console.log('  2. Test knowledge base search');
  console.log('  3. Deploy edge functions');
  if (SKIP_EMBEDDINGS) {
    console.log('  4. ⚠️  Run with embeddings enabled for vector search');
  }
}

main().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
