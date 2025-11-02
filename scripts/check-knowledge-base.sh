#!/bin/bash
# scripts/check-knowledge-base.sh
# Check the knowledge base status via Supabase REST API

SUPABASE_URL="https://enpqzoeohonguemzyifo.supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVucHF6b2VvaG9uZ3VlbXp5aWZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2MTM1MzksImV4cCI6MjA2ODE4OTUzOX0.4jpb1342g2tlas1s6uQDLdd8nHpOQMGgDrt980uuHQo"

echo "🔍 Checking EquipIQ Knowledge Base Status"
echo "=========================================="
echo ""

# Check Equipment Types
echo "📋 EQUIPMENT TYPES:"
TYPES_RESPONSE=$(curl -s -X GET "${SUPABASE_URL}/rest/v1/equipment_types?select=id,name&order=name" \
  -H "apikey: ${SUPABASE_ANON_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}")

TYPES_COUNT=$(echo "$TYPES_RESPONSE" | jq '. | length' 2>/dev/null || echo "0")

if [ "$TYPES_COUNT" -eq 0 ]; then
  echo "⚠️  No equipment types found"
else
  echo "✅ Found $TYPES_COUNT equipment types:"
  echo "$TYPES_RESPONSE" | jq -r '.[] | "   • \(.name)"' 2>/dev/null
fi

echo ""

# Check Knowledge Chunks
echo "📚 KNOWLEDGE CHUNKS:"
CHUNKS_RESPONSE=$(curl -s -X GET "${SUPABASE_URL}/rest/v1/knowledge_chunks?select=id,equipment_type_id,source,chunk_type&limit=1000" \
  -H "apikey: ${SUPABASE_ANON_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}")

CHUNKS_COUNT=$(echo "$CHUNKS_RESPONSE" | jq '. | length' 2>/dev/null || echo "0")

if [ "$CHUNKS_COUNT" -eq 0 ]; then
  echo "⚠️  No knowledge chunks found"
  echo "   The knowledge base is empty - no documents have been ingested yet."
else
  echo "✅ Found $CHUNKS_COUNT knowledge chunks!"
  echo ""
  echo "   Sources:"
  echo "$CHUNKS_RESPONSE" | jq -r '.[].source' 2>/dev/null | sort | uniq -c | awk '{print "   • " $2 ": " $1 " chunks"}'
fi

echo ""

# Check Equipment Documentation
echo "📄 EQUIPMENT DOCUMENTATION:"
DOCS_RESPONSE=$(curl -s -X GET "${SUPABASE_URL}/rest/v1/equipment_documentation?select=id,title,doc_type&limit=100" \
  -H "apikey: ${SUPABASE_ANON_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}")

DOCS_COUNT=$(echo "$DOCS_RESPONSE" | jq '. | length' 2>/dev/null || echo "0")

if [ "$DOCS_COUNT" -eq 0 ]; then
  echo "⚠️  No equipment documentation found"
else
  echo "✅ Found $DOCS_COUNT documents:"
  echo "$DOCS_RESPONSE" | jq -r '.[] | "   • \(.title) (\(.doc_type))"' 2>/dev/null
fi

echo ""
echo "=========================================="
echo "📊 SUMMARY:"
echo "=========================================="

if [ "$CHUNKS_COUNT" -gt 0 ]; then
  echo "✅ Knowledge base is SET UP and READY!"
  echo "   You have $TYPES_COUNT equipment types with $CHUNKS_COUNT knowledge chunks."
  echo ""
  echo "🎯 You can now test the chatbot:"
  echo "   1. Go to https://www.equipiq.io"
  echo "   2. Select an equipment type"
  echo "   3. Ask troubleshooting questions"
  echo "   4. The AI will use the ingested knowledge to respond"
else
  echo "⚠️  Knowledge base needs to be populated"
  echo "   You have $TYPES_COUNT equipment types but NO knowledge chunks."
  echo ""
  echo "📝 Next steps:"
  echo "   1. Log into the admin dashboard at https://www.equipiq.io"
  echo "   2. Go to Knowledge Base section"
  echo "   3. Upload equipment manuals, FAQs, or troubleshooting guides"
fi

echo ""
