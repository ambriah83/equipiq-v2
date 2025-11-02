// scripts/check-knowledge-base.js
// Script to check what knowledge exists in the Supabase database

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://enpqzoeohonguemzyifo.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
  console.error('❌ Error: SUPABASE_SERVICE_ROLE_KEY or VITE_SUPABASE_ANON_KEY not found');
  console.log('\nPlease set one of these environment variables:');
  console.log('  export SUPABASE_SERVICE_ROLE_KEY=your-service-role-key');
  console.log('  or');
  console.log('  export VITE_SUPABASE_ANON_KEY=your-anon-key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkKnowledgeBase() {
  console.log('🔍 Checking EquipIQ Knowledge Base Status\n');
  console.log('=' .repeat(60));

  try {
    // 1. Check Equipment Types
    console.log('\n📋 EQUIPMENT TYPES:');
    const { data: equipmentTypes, error: typesError } = await supabase
      .from('equipment_types')
      .select('id, name, description')
      .order('name');

    if (typesError) {
      console.log('❌ Error fetching equipment types:', typesError.message);
    } else if (!equipmentTypes || equipmentTypes.length === 0) {
      console.log('⚠️  No equipment types found in database');
    } else {
      console.log(`✅ Found ${equipmentTypes.length} equipment types:`);
      equipmentTypes.forEach((type, index) => {
        console.log(`   ${index + 1}. ${type.name}`);
      });
    }

    // 2. Check Knowledge Chunks
    console.log('\n📚 KNOWLEDGE CHUNKS:');
    const { data: chunks, error: chunksError } = await supabase
      .from('knowledge_chunks')
      .select('id, equipment_type_id, source, chunk_type, created_at')
      .order('created_at', { ascending: false });

    if (chunksError) {
      console.log('❌ Error fetching knowledge chunks:', chunksError.message);
    } else if (!chunks || chunks.length === 0) {
      console.log('⚠️  No knowledge chunks found in database');
      console.log('   The knowledge base is empty - no documents have been ingested yet.');
    } else {
      console.log(`✅ Found ${chunks.length} knowledge chunks!`);

      // Group by equipment type
      const byType = chunks.reduce((acc, chunk) => {
        const typeId = chunk.equipment_type_id || 'unknown';
        if (!acc[typeId]) acc[typeId] = [];
        acc[typeId].push(chunk);
        return acc;
      }, {});

      console.log('\n   Knowledge by Equipment Type:');
      for (const [typeId, typeChunks] of Object.entries(byType)) {
        const typeName = equipmentTypes?.find(t => t.id === typeId)?.name || 'Unknown Type';
        console.log(`   • ${typeName}: ${typeChunks.length} chunks`);

        // Show sources
        const sources = [...new Set(typeChunks.map(c => c.source))];
        sources.forEach(source => {
          const count = typeChunks.filter(c => c.source === source).length;
          console.log(`     - ${source}: ${count} chunks`);
        });
      }
    }

    // 3. Check Equipment Documentation
    console.log('\n📄 EQUIPMENT DOCUMENTATION:');
    const { data: docs, error: docsError } = await supabase
      .from('equipment_documentation')
      .select('id, equipment_type_id, title, doc_type, created_at')
      .order('created_at', { ascending: false });

    if (docsError) {
      console.log('❌ Error fetching documentation:', docsError.message);
    } else if (!docs || docs.length === 0) {
      console.log('⚠️  No equipment documentation found');
    } else {
      console.log(`✅ Found ${docs.length} documents:`);
      docs.forEach((doc, index) => {
        const typeName = equipmentTypes?.find(t => t.id === doc.equipment_type_id)?.name || 'Unknown';
        console.log(`   ${index + 1}. ${doc.title} (${typeName}) - ${doc.doc_type}`);
      });
    }

    // 4. Check Chat Sessions
    console.log('\n💬 CHAT SESSIONS:');
    const { data: sessions, error: sessionsError } = await supabase
      .from('chat_sessions')
      .select('id, created_at, resolved')
      .order('created_at', { ascending: false })
      .limit(10);

    if (sessionsError) {
      console.log('❌ Error fetching chat sessions:', sessionsError.message);
    } else if (!sessions || sessions.length === 0) {
      console.log('⚠️  No chat sessions found');
    } else {
      console.log(`✅ Found ${sessions.length} recent chat sessions`);
      const resolved = sessions.filter(s => s.resolved).length;
      console.log(`   ${resolved} resolved, ${sessions.length - resolved} unresolved`);
    }

    // 5. Summary and Recommendations
    console.log('\n' + '='.repeat(60));
    console.log('📊 SUMMARY:');
    console.log('='.repeat(60));

    const hasTypes = equipmentTypes && equipmentTypes.length > 0;
    const hasChunks = chunks && chunks.length > 0;
    const hasDocs = docs && docs.length > 0;

    if (hasTypes && hasChunks) {
      console.log('✅ Knowledge base is SET UP and READY!');
      console.log(`   You have ${equipmentTypes.length} equipment types with ${chunks.length} knowledge chunks.`);
      console.log('\n🎯 You can now test the chatbot:');
      console.log('   1. Select an equipment type that has knowledge');
      console.log('   2. Ask troubleshooting questions');
      console.log('   3. The AI will use the ingested knowledge to respond');
    } else if (hasTypes && !hasChunks) {
      console.log('⚠️  Knowledge base is PARTIALLY SET UP');
      console.log(`   You have ${equipmentTypes.length} equipment types but NO knowledge chunks.`);
      console.log('\n📝 Next steps:');
      console.log('   1. Log into the admin dashboard');
      console.log('   2. Go to Knowledge Base section');
      console.log('   3. Upload equipment manuals, FAQs, or troubleshooting guides');
    } else {
      console.log('⚠️  Knowledge base is NOT SET UP');
      console.log('\n📝 Next steps:');
      console.log('   1. Run migrations to create equipment types');
      console.log('   2. Log into the admin dashboard');
      console.log('   3. Upload equipment documentation');
    }

  } catch (error) {
    console.error('\n❌ Unexpected error:', error);
  }
}

// Run the check
checkKnowledgeBase()
  .then(() => {
    console.log('\n✅ Check complete!\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Failed:', error);
    process.exit(1);
  });
