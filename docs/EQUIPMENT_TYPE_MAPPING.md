# Equipment Type Mapping System

## Overview
This system processes Limble asset exports and creates proper equipment type mappings for the EquipIQ AI to provide accurate, equipment-specific troubleshooting.

## The Problem
- Limble uses asset IDs (e.g., `123456`) to identify equipment
- EquipIQ AI needs equipment types (e.g., `spray_booth`, `sun_bed`) to provide relevant knowledge
- Without proper mapping, the AI can't give equipment-specific advice

## The Solution
We've created a comprehensive mapping system that:
1. Processes your Limble assets Excel export
2. Determines equipment types based on categories and names
3. Creates mapping files used by the frontend
4. Ensures the AI gets proper context for accurate responses

## How to Process Your Limble Assets

### 1. Export from Limble
Export your assets from Limble as an Excel file (usually named `Limble Assets.xlsx`)

### 2. Run the Processing Script
```bash
cd /mnt/c/Users/ambri/Projects/equipiq-v2
node scripts/process-limble-assets.js "C:\Users\ambri\Downloads\Limble Assets.xlsx"
```

### 3. Output Files
The script generates these files in `data/equipment-mappings/`:
- `equipment-mappings.json` - Full equipment details with types
- `asset-id-to-type.json` - Quick lookup map for asset IDs
- `equipment-by-location.json` - Equipment grouped by location
- `location-mappings.json` - Location ID to friendly name map

### 4. Automatic Integration
The frontend automatically uses these mappings through the `useEquipmentMapping` hook.

## Equipment Type Categories

### Supported Equipment Types
- `sun_bed` - Tanning beds (Sun category)
- `spray_booth` - Spray tan booths (Spa/Spray categories)
- `red_light_therapy` - Red light therapy devices
- `wellness_pod` - Cocoon pods and similar
- `hydration_station` - Hydration equipment
- `massage_equipment` - Massage chairs/tables
- `sauna` - Infrared saunas
- `cryotherapy` - Cryo chambers
- `float_tank` - Float tanks
- `general_equipment` - Fallback for unrecognized equipment

### Category Detection
The system uses intelligent detection:
1. Checks Limble category field (removes HTML tags)
2. Analyzes equipment name and model
3. Uses pattern matching for common brands:
   - VersaSpa → `spray_booth`
   - Mystic → `spray_booth`
   - Sun/Tan keywords → `sun_bed`
   - Cocoon → `wellness_pod`
   - etc.

## How It Works in the App

### Before (Broken)
```javascript
// Sent asset ID to AI
equipment_type_id: 123456  // AI doesn't know what this is!
```

### After (Fixed)
```javascript
// Sends proper equipment type
equipment_type_id: "spray_booth"  // AI knows to use spray booth knowledge!
```

## Troubleshooting

### Missing Mappings
If equipment isn't being recognized:
1. Check the Excel file has proper Category data
2. Look at the generated `equipment-mappings.json`
3. Add new patterns to `CATEGORY_TO_TYPE_MAP` in the script

### Testing the Mapping
1. Select equipment in the app
2. Check browser console for equipment type
3. Verify AI responses are equipment-specific

## Benefits
- ✅ AI gives accurate, equipment-specific advice
- ✅ Proper knowledge base context for each equipment type
- ✅ Better troubleshooting accuracy
- ✅ Reduced "generic" responses
- ✅ Seamless integration with existing Limble data