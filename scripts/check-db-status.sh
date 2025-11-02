#!/bin/bash
# scripts/check-db-status.sh
# Check knowledge base status using direct database connection

# Load environment variables
if [ -f .env.local ]; then
  export $(cat .env.local | grep -v '^#' | xargs)
fi

DB_URL=${SUPABASE_DB_URL:-"postgresql://postgres:K8pzVGCcE96oC1Ff@db.enpqzoeohonguemzyifo.supabase.co:5432/postgres"}

echo "🔍 Checking EquipIQ Knowledge Base Status"
echo "=========================================="
echo ""

# Check connection
echo "📡 Testing database connection..."
psql "$DB_URL" -c "SELECT version();" > /dev/null 2>&1
if [ $? -eq 0 ]; then
  echo "✅ Connected to database"
else
  echo "❌ Failed to connect to database"
  echo "   Try using the connection pooler or check your network"
  exit 1
fi

echo ""
echo "📋 EQUIPMENT TYPES:"
psql "$DB_URL" -t -c "
SELECT
  COALESCE(COUNT(*), 0) as count
FROM equipment_types;
" | xargs | awk '{print "Found " $1 " equipment types"}'

echo ""
echo "📚 KNOWLEDGE BASE STATUS:"
echo ""

psql "$DB_URL" << 'SQL'
SELECT
  et.name as "Equipment Type",
  COUNT(DISTINCT kc.id) as "Chunks",
  COUNT(DISTINCT ed.id) as "Docs",
  CASE
    WHEN COUNT(DISTINCT kc.id) > 0 THEN '✅ Ready'
    ELSE '⚠️  Empty'
  END as "Status"
FROM equipment_types et
LEFT JOIN knowledge_chunks kc ON kc.equipment_type_id = et.id
LEFT JOIN equipment_documentation ed ON ed.equipment_type_id = et.id
GROUP BY et.id, et.name
ORDER BY COUNT(DISTINCT kc.id) DESC, et.name;
SQL

echo ""
echo "=========================================="
echo "📊 SUMMARY:"
echo ""

# Get totals
TOTAL_CHUNKS=$(psql "$DB_URL" -t -c "SELECT COUNT(*) FROM knowledge_chunks;" | xargs)
TOTAL_DOCS=$(psql "$DB_URL" -t -c "SELECT COUNT(*) FROM equipment_documentation;" | xargs)

echo "Total Knowledge Chunks: $TOTAL_CHUNKS"
echo "Total Documents: $TOTAL_DOCS"
echo ""

if [ "$TOTAL_CHUNKS" -gt 0 ]; then
  echo "✅ Knowledge base is populated and ready to test!"
  echo ""
  echo "🎯 Next steps:"
  echo "   1. Go to https://www.equipiq.io"
  echo "   2. Log in and select equipment with knowledge"
  echo "   3. Ask troubleshooting questions"
  echo "   4. Verify AI provides specific, detailed answers"
else
  echo "⚠️  Knowledge base is empty"
  echo ""
  echo "📝 Next steps:"
  echo "   1. Log into admin dashboard"
  echo "   2. Go to Knowledge Base section"
  echo "   3. Upload equipment manuals and guides"
fi

echo ""
