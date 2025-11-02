# EquipIQ V2 Knowledge Base - Complete Data Sources

## 📊 ALL Data Sources for Ingestion

### Source 1: Troubleshooting Chat (Basecamp)
**File**: `Troubleshooting Chat/trouble shoot.txt`
- **Lines**: 48,040 lines
- **Extracted**: 837 Q&A pairs
- **Type**: Real staff-to-staff troubleshooting conversations
- **Format**: Parsed JSON available at `Troubleshooting Chat/basecamp-qa-pairs.json`
- ✅ **Status**: READY

### Source 2: Maint CHATGPT BOT ANALYSIS (Limble Conversations)
**File**: `Maint CHATGPT BOT ANALYSIS/fine-tuning-dataset-2025-07-18T18-51-43-964Z.jsonl`
- **Count**: 650 AI-generated troubleshooting Q&A pairs
- **Type**: ChatGPT bot training data from Limble CMMS
- **Format**: JSONL (one conversation per line)
- ✅ **Include**: YES - valuable troubleshooting patterns

### Source 3: Equipment Spec Sheets (38 files)
**Location**: `Maint CHATGPT BOT ANALYSIS/Equipment Spec Sheets/`

**File List**:
1. VersaSpa Pro Installation Requirements.pdf
2. Norvell Auto Revolution Spray Tan Manual.docx
3. Beauty Angel 7200 SPECS V2.docx
4. Beauty Angel RVT 30 SPECS.pdf
5. Ergoline Prestige 1600 SPECS V2.docx
6. Ergoline Master Specs Sheet.pdf
7. Skin Wellness Pro Owner's Manual.pdf
8. Skin Wellness Pro Electrical Requirements.pdf
9. COCOON FITNESS POD SPEC SHEET.pdf
10. Mystic Tan Unity Installation Requirements.pdf
11. MegaSun 6800 alpha pearl Salescards.pdf
12. MegaSun 8000 Alpha extraSun+ Tech Data Sheet.pdf
13. Prestige 1100.pdf
14. Inspiration 550.pdf
15. Open Sun 1050 SPECS V2.docx
16. Sunrise 7200 HybridLight SPECS.pdf
17. Sun Angel Duo 1400 SPECS V2.docx
18. Sunrise 480 SPECS V2.docx
19. Vitality TLT3 - Spec Sheet.pdf
20. Vitality 42-3 PLT.pdf
21. Vitality 46-3 HLT.pdf
22. Wellsystem Wave - Spec Sheet.pdf
23. Revive PRO-IR Laydown - Spec Sheet.pdf
24. Revive Red-Light Plus STAND UP- Spec Sheet.pdf
25. PASSION 40_3 SPECS.pdf
26. Spirit All Versions.pdf
27. Specsheet_P9hybridSun_WonderWhite_US.pdf
28. JK Equip List (2 versions)
29-38. Additional specs...

### Source 4: VersaSpa Troubleshooting Guides
**Location**: `Versa/Versa Troubleshooting/`

**Documents**:
1. **VersaPro Troubleshooting Guide.docx** ⭐ PRIMARY
2. **VersaPRO Diagnostic Tech Guide.docx** ⭐ PRIMARY
3. Versa cleaning - nozzles and nozzle covers.docx
4. Versa new solution change out.docx

**Videos** (14 MOV files):
- Hard reset procedures
- Invalid solution errors
- Pump troubleshooting
- Turbine tests
- Spray tests
- Deep cleaning procedures
- Sump pump maintenance
- Power switch location
- Session count

### Source 5: TMAX Timer System Guides
**Location**: `TMAX/`

**Documents**:
1. **Tmax Manager Pro Manual.pdf** ⭐ PRIMARY
2. **Tmax Touch Manual.pdf** ⭐ PRIMARY
3. **Timer Control Module MASTER RESET GUIDE.docx** ⭐ PRIMARY
4. Tmax G2 Wall Timer Reset.pptx
5. Changing frequencies on G2 Access Point.pdf (2 versions)

**Videos**:
- Tmax wall timer.MOV

## 🎯 Equipment Type Mapping

### Spray Tan Equipment
- **VersaSpa Pro**: Spec + 2 troubleshooting guides + 14 videos
- **Norvell Auto Revolution**: Manual
- **Mystic Tan Unity**: Installation guide

### UV Tanning Beds
- **Ergoline**: Prestige 1600, Prestige 1100, Affinity, Master Specs
- **MegaSun**: 6800, 8000 models
- **Sunrise**: 7200 HybridLight, 480
- **Sun Angel**: Duo 1400
- **Open Sun**: 1050
- **Vitality**: TLT3, 42-3 PLT, 46-3 HLT
- **Inspiration**: 550
- **Passion**: 40_3
- **Spirit**: All Versions
- **P9 hybridSun**: WonderWhite

### Red Light/Wellness
- **Beauty Angel**: 7200, RVT 30
- **Revive PRO-IR**: Laydown
- **Revive Red-Light Plus**: Stand Up

### Hydration/Spa
- **Skin Wellness Pro** (Cocoon Aqua): Owner's Manual + Electrical
- **COCOON FITNESS POD**: Spec Sheet
- **Wellsystem Wave**: Spec Sheet

### Timer Systems
- **TMAX Manager Pro**
- **TMAX Touch**
- **TMAX Wall Timer/G2**

## 📋 Ingestion Plan - Option A (Comprehensive)

### Phase 1: Text Sources (FAST)
1. ✅ Troubleshooting Chat - 837 Q&A pairs
2. ✅ Limble/Maint Chat - 650 Q&A pairs
**Subtotal**: ~1,487 chunks

### Phase 2: Equipment Guides (MEDIUM)
3. VersaSpa Troubleshooting Guides (4 DOCX)
4. TMAX Guides (5 PDFs/DOCX/PPTX)
**Subtotal**: ~100-200 chunks

### Phase 3: Equipment Spec Sheets (DETAILED)
5. All 38 Spec Sheets (PDFs/DOCX)
**Subtotal**: ~500-1,000 chunks

### Total Estimated: 2,000-2,700 knowledge chunks

## 🔧 Technical Requirements

### NPM Packages Needed:
```bash
npm install pdf-parse mammoth pptx-parser
```

### Processing Pipeline:
1. **PDF files** → pdf-parse → text extraction
2. **DOCX files** → mammoth → text extraction
3. **PPTX files** → pptx-parser → slide text
4. **Text files** → already processed
5. **JSONL** → already parsed

### Chunk Strategy:
- **Spec sheets**: By section/page
- **Guides**: By procedure/topic
- **Chat**: By Q&A pair
- **Max chunk size**: 1000 tokens (~4000 chars)

## 💰 Cost & Time Estimate

### OpenAI Embeddings:
- **2,500 chunks** × 500 tokens avg = 1.25M tokens
- **Cost**: ~$0.12 total
- **Time**: ~30-45 minutes (with rate limiting)

### Processing:
- **PDF extraction**: ~5-10 minutes
- **DOCX extraction**: ~2-5 minutes
- **Database insertion**: ~30 minutes
- **Total**: ~45-60 minutes

## ✅ Verification Checklist

After ingestion, verify:
- [ ] All 38 equipment spec sheets processed
- [ ] VersaSpa guides (4 files) processed
- [ ] TMAX guides (5 files) processed
- [ ] Troubleshooting chat (837 pairs) ingested
- [ ] Maint chat (650 pairs) ingested
- [ ] Equipment types correctly classified
- [ ] Embeddings generated for all chunks
- [ ] No duplicate content

## 📝 Notes for Future Reference

- **Videos**: Not processed in Phase 1 (would need transcription)
- **Images**: HEIC/PNG files contain screenshots - not processed
- **Priority**: Focus on text-based troubleshooting content first
- **Updates**: When new manuals added, re-run ingestion script

---
**Last Updated**: 2025-11-02
**Status**: Ready for comprehensive ingestion
