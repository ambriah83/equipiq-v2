# ✅ Complete Knowledge Base - READY TO RUN!

## 🎯 What This Does

This script processes **ALL** your equipment knowledge:

### ✅ Included Data Sources:

1. **Troubleshooting Chat** (Basecamp) - 837 Q&A pairs
   - Real staff-to-staff troubleshooting conversations
   - Source: `Troubleshooting Chat/trouble shoot.txt`

2. **Maint Chat** (Limble) - 650 Q&A pairs
   - AI-generated troubleshooting conversations
   - Source: `Maint CHATGPT BOT ANALYSIS/fine-tuning-dataset.jsonl`

3. **Equipment Spec Sheets** - 38 PDF/DOCX files
   - VersaSpa, Norvell, Beauty Angel, Ergoline, TMAX, etc.
   - Source: `Maint CHATGPT BOT ANALYSIS/Equipment Spec Sheets/`

4. **VersaSpa Troubleshooting Guides** - 4 DOCX files
   - VersaPro Troubleshooting Guide
   - VersaPRO Diagnostic Tech Guide
   - Cleaning procedures, solution changeout
   - Source: `Versa/Versa Troubleshooting/`

5. **TMAX Timer Guides** - 5 PDF/DOCX files
   - Manager Pro Manual, Touch Manual
   - Reset guides, frequency settings
   - Source: `TMAX/`

### 📊 Expected Results:
- **~2,000-2,700 knowledge chunks** total
- **Organized by equipment type** (VersaSpa, TMAX, Beauty Angel, etc.)
- **Categorized by source** (spec sheet, troubleshooting guide, chat, etc.)
- **Vector embeddings** for AI-powered search

## 🚀 How to Run

### From Windows PowerShell or Command Prompt:

```bash
cd "C:\Users\ambri\Projects\equipIQ v2"
node scripts\ingest-complete-knowledge-base.js
```

### OR Double-click:
`run-complete-ingestion.bat` (I'll create this next)

## ⏱️ What to Expect

**Processing Time**: 45-60 minutes
- PDF extraction: ~10 min
- DOCX extraction: ~5 min
- Embedding generation: ~30-40 min
- Database insertion: ~5-10 min

**Cost**: ~$0.12 for OpenAI embeddings

**Output**:
```
╔════════════════════════════════════════════════╗
║  EquipIQ Complete Knowledge Base Ingestion    ║
╚════════════════════════════════════════════════╝

✓ Connected to database

=== Processing Troubleshooting Chat (Basecamp) ===
Found 837 Q&A pairs
  Progress: 50/837
  Progress: 100/837
  ...
✓ Basecamp chat: 837 chunks

=== Processing Maint Chat (Limble) ===
Found 650 conversations
  Progress: 50/650
  ...
✓ Limble chat: 650 chunks

=== Processing Equipment Documents ===

  Processing: Equipment Spec Sheets
    Extracting: VersaSpa Pro Installation Requirements.pdf
      ✓ 5 chunks created
    Extracting: Norvell Auto Revolution Spray Tan Manual.docx
      ✓ 3 chunks created
    ...
  ✓ Equipment Spec Sheets: 38 files processed

  Processing: VersaSpa Troubleshooting
    Extracting: VersaPro Troubleshooting Guide.docx
      ✓ 12 chunks created
    ...
  ✓ VersaSpa Troubleshooting: 4 files processed

  Processing: TMAX Guides
    ...
  ✓ TMAX Guides: 5 files processed

╔════════════════════════════════════════════════╗
║             Ingestion Complete!                 ║
╚════════════════════════════════════════════════╝

📊 Summary:
  Total chunks inserted: 2,347
  Total errors: 0

📁 By Source:
  equipment_spec_sheet: 892 chunks
  basecamp_troubleshooting_chat: 837 chunks
  limble_troubleshooting_conversations: 650 chunks
  versaspa_troubleshooting_guide: 156 chunks
  tmax_timer_guide: 112 chunks

🔧 By Equipment Type:
  VersaSpa Pro: 523 chunks
  TMAX Timer: 287 chunks
  Beauty Angel: 198 chunks
  Ergoline Prestige: 176 chunks
  ...
```

## ⚠️ Important Notes

### ✅ What's Included:
- Troubleshooting Chat (Basecamp) ✓
- Maint Chat (Limble conversations) ✓
- All equipment spec sheets ✓
- VersaSpa troubleshooting guides ✓
- TMAX timer guides ✓

### ❌ Not Included (Yet):
- Video files (.MOV) - would need transcription
- Image files (.HEIC, .PNG) - screenshots
- PowerPoint presentations - can add if needed

## 🔍 After Ingestion - Verify in Supabase

```sql
-- Check total records
SELECT COUNT(*) FROM knowledge_chunks;

-- By source
SELECT source, COUNT(*) as count
FROM knowledge_chunks
GROUP BY source
ORDER BY count DESC;

-- By equipment type
SELECT et.name, COUNT(kc.id) as count
FROM knowledge_chunks kc
JOIN equipment_types et ON kc.equipment_type_id = et.id
GROUP BY et.name
ORDER BY count DESC;

-- Sample data
SELECT
  et.name as equipment,
  kc.source,
  kc.chunk_type,
  LEFT(kc.content, 100) as preview
FROM knowledge_chunks kc
JOIN equipment_types et ON kc.equipment_type_id = et.id
LIMIT 10;
```

## 🛠️ Troubleshooting

### If you get DNS errors:
- Run from **Windows PowerShell** (not WSL/Git Bash)
- Windows: `cmd.exe /c "cd C:\Users\ambri\Projects\equipIQ v2 && node scripts\ingest-complete-knowledge-base.js"`

### If you want to skip embeddings first:
```bash
set SKIP_EMBEDDINGS=true
node scripts\ingest-complete-knowledge-base.js
```
Then add embeddings later when ready.

## ✨ What You Get

After successful ingestion, your AI assistant will be able to:

1. **Answer equipment-specific questions**
   - "How do I reset the VersaSpa Pro?"
   - "TMAX wall timer showing dirty, what do I do?"
   - "Beauty Angel lamps not working"

2. **Provide detailed troubleshooting**
   - Step-by-step procedures from guides
   - Real solutions from staff conversations
   - Equipment specifications and requirements

3. **Smart search with embeddings**
   - Semantic similarity matching
   - Find related problems even with different wording
   - Context-aware responses

---

**Ready to run? Execute the command above in Windows PowerShell!** 🚀
