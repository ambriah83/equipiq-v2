# EquipIQ V2 Knowledge Base - Data Sources Inventory

## 📊 Summary

This document catalogs ALL available data sources for the EquipIQ knowledge base ingestion.

## 🎯 Data Sources by Type

### 1. Troubleshooting Chat (Real Staff Conversations)
**Location**: `Troubleshooting Chat/`
- **trouble shoot.txt** - 48,040 lines of Basecamp chat
- **Extracted**: 837 Q&A pairs
- **Source**: Real staff-to-staff troubleshooting discussions
- **Value**: Actual field problems and solutions
- ✅ **Status**: PARSED - Ready for ingestion

### 2. Equipment Spec Sheets & Manuals
**Location**: `Maint CHATGPT BOT ANALYSIS/Equipment Spec Sheets/`
- **Count**: 38 PDF/DOCX files
- **Equipment Types**:
  - VersaSpa Pro
  - Norvell Auto Revolution
  - Beauty Angel 7200, RVT 30
  - Ergoline (Prestige 1600, Affinity, Master Specs)
  - Skin Wellness Pro (Aqua)
  - MegaSun models
  - Mystic Tan Unity
  - Sunrise 7200 HybridLight
  - Cocoon Fitness Pod
  - Vitality series
  - And more...
- ⏳ **Status**: Needs PDF extraction

### 3. VersaSpa Troubleshooting Guides
**Location**: `Versa/Versa Troubleshooting/`
- **VersaPro Troubleshooting Guide.docx** ⭐
- **VersaPRO Diagnostic Tech Guide.docx** ⭐
- **Versa cleaning - nozzles and nozzle covers.docx**
- **Versa new solution change out.docx**
- **Video files** (.MOV):
  - Hard reset procedures
  - Invalid solution errors
  - Pump troubleshooting
  - Turbine tests
  - Spray tests
  - Deep cleaning
- ⏳ **Status**: Needs DOCX + video extraction

### 4. TMAX Timer System Guides
**Location**: `TMAX/`
- **Tmax Manager Pro Manual.pdf**
- **Tmax Touch Manual.pdf**
- **Timer Control Module MASTER RESET GUIDE.docx** ⭐
- **Tmax G2 Wall Timer Reset.pptx**
- **Changing frequencies on G2 Access Point.pdf**
- **Video**: Tmax wall timer.MOV
- ⏳ **Status**: Needs extraction

### 5. Limble AI Conversations (Optional)
**Location**: `Development-Projects/Maintenance EquipIQ/Maint CHATGPT BOT ANALYSIS/`
- **fine-tuning-dataset.jsonl** - 650 AI-generated Q&A pairs
- ❓ **Status**: Decide if to include

## 📋 Recommended Ingestion Priority

### Phase 1: High Value (Do First)
1. ✅ **Troubleshooting Chat** (837 Q&A pairs) - PARSED
2. **VersaSpa Troubleshooting Guides** (4 DOCX files)
3. **TMAX Reset Guides** (3 documents)
4. **Equipment Spec Sheets** (38 files)

### Phase 2: Medium Value
5. **Limble AI Conversations** (650 pairs) - if helpful
6. **Video transcriptions** (if possible)

## 🎯 Equipment Type Organization

Based on the files found, organize knowledge by:

### Spray Equipment
- VersaSpa Pro (✅ Manuals + Troubleshooting)
- Norvell Auto Revolution (✅ Manual)
- Mystic Tan Unity (✅ Spec sheet)

### UV/Tanning Beds
- Ergoline (Prestige, Affinity, Vitality)
- MegaSun models
- Beauty Angel 7200
- Sunrise 7200 HybridLight

### Hydration/Spa Equipment
- Skin Wellness Pro (Cocoon Aqua)
- Cocoon Fitness Pod
- Red Light therapy units

### Timer Systems
- TMAX Manager Pro
- TMAX Touch
- TMAX Wall Timer/G2

### LED/Lighting
- Beauty Angel
- LED strip troubleshooting (from chat)

## 🔧 Technical Approach

### Document Processing
```javascript
// For each equipment type:
1. Extract text from PDFs/DOCX
2. Chunk into sections
3. Identify equipment type from filename/content
4. Generate embeddings
5. Store with metadata
```

### Metadata Structure
```json
{
  "equipment_type": "VersaSpa Pro",
  "document_type": "troubleshooting_guide",
  "source_file": "VersaPro Troubleshooting Guide.docx",
  "section": "Hard Reset Procedure",
  "original_filename": "...",
  "chunk_index": 0
}
```

## 📊 Expected Knowledge Base Size

- **Troubleshooting Chat**: ~837 chunks
- **VersaSpa Guides**: ~50-100 chunks
- **TMAX Guides**: ~30-50 chunks
- **Equipment Specs**: ~500-1000 chunks
- **Limble (optional)**: ~650 chunks

**Total Estimate**: 1,400 - 2,600 knowledge chunks

## 💰 Cost Estimate

- **OpenAI Embeddings**: ~$0.10 - $0.25 total
- **Processing Time**: 15-30 minutes
- **Storage**: Minimal (text + vectors)

## ✅ Next Steps

1. Install PDF extraction library (pdf-parse)
2. Install DOCX parser (mammoth)
3. Create equipment-aware ingestion script
4. Process in batches by equipment type
5. Verify equipment classification accuracy
