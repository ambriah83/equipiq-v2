// scripts/process-limble-assets.js
// Process Limble assets export and create equipment type mappings

import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Equipment type mappings based on Limble categories
const CATEGORY_TO_TYPE_MAP = {
  'sun': 'sun_bed',
  'spa': 'spray_booth',
  'spray': 'spray_booth',
  'red light': 'red_light_therapy',
  'cocoon': 'wellness_pod',
  'hydration': 'hydration_station',
  'massage': 'massage_equipment',
  'sauna': 'sauna',
  'cryotherapy': 'cryotherapy',
  'float': 'float_tank'
};

// Location ID to friendly name mapping
const LOCATION_MAP = {
  '23600': 'ALL',
  '23597': 'DC',
  '23598': 'ES',
  '23599': 'NW',
  '25303': 'WH'
};

// Clean HTML tags from category field
function cleanCategory(category) {
  if (!category) return '';
  return category.replace(/<[^>]*>/g, '').trim().toLowerCase();
}

// Standardize asset type based on Shawnee pattern
function standardizeAssetType(assetType) {
  if (!assetType) return '';
  
  // Remove HTML tags first
  const cleaned = assetType.replace(/<[^>]*>/g, '').trim();
  
  // Map to standard types
  const typeMap = {
    'sun': 'Sun',
    'spa': 'Spa',
    'spray': 'Spray',
    'room': 'Room',
    'location': 'Location',
    'tech': 'Tech',
    'digital': 'Digital',
    'hvac': 'HVAC',
    'appliances': 'Appliances',
    'utility': 'Utility',
    'electrical': 'Electrical'
  };
  
  const lower = cleaned.toLowerCase();
  return typeMap[lower] || cleaned;
}

// Standardize room names following Shawnee pattern
function standardizeRoomName(name) {
  if (!name) return '';
  
  // Pattern: "EW- Room #2" → "Room 2"
  // Pattern: "#26 EW" → "Room 26"
  // Pattern: "#13 EW - Empty" → "Room 13"
  
  // Extract room number
  const roomMatch = name.match(/#?\s*(\d+)/);
  if (roomMatch && (name.toLowerCase().includes('room') || name.includes('#'))) {
    return `Room ${roomMatch[1]}`;
  }
  
  return name;
}

// Extract location code from equipment name
function extractLocationCode(name) {
  // Pattern: "Affinity 950 #2 EW" → "EW"
  const match = name.match(/\b([A-Z]{2,3})\b$/);
  return match ? match[1] : '';
}

// Determine equipment type from category and name
function determineEquipmentType(category, assetName, model) {
  const cleanedCategory = cleanCategory(category);
  const nameAndModel = `${assetName} ${model}`.toLowerCase();
  
  // Check category first
  for (const [key, type] of Object.entries(CATEGORY_TO_TYPE_MAP)) {
    if (cleanedCategory.includes(key)) {
      return type;
    }
  }
  
  // Check asset name and model for clues
  if (nameAndModel.includes('versa')) return 'spray_booth';
  if (nameAndModel.includes('mystic')) return 'spray_booth';
  if (nameAndModel.includes('pura')) return 'spray_booth';
  if (nameAndModel.includes('sun') || nameAndModel.includes('tan')) return 'sun_bed';
  if (nameAndModel.includes('cocoon')) return 'wellness_pod';
  if (nameAndModel.includes('hydra')) return 'hydration_station';
  if (nameAndModel.includes('red light')) return 'red_light_therapy';
  if (nameAndModel.includes('sauna')) return 'sauna';
  if (nameAndModel.includes('cryo')) return 'cryotherapy';
  if (nameAndModel.includes('float')) return 'float_tank';
  
  // Default fallback
  return 'general_equipment';
}

// Process the Limble assets file
async function processLimbleAssets(filePath) {
  console.log(`Processing file: ${filePath}`);
  
  // Read the Excel file
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(worksheet);
  
  console.log(`Found ${data.length} assets`);
  
  // Process each asset
  const equipmentMappings = [];
  const equipmentByLocation = {};
  const stats = {
    totalAssets: 0,
    topLevelAssets: 0,
    roomAssets: 0,
    equipmentTypeCount: {}
  };
  
  data.forEach(row => {
    const assetId = row['Limble Asset ID'];
    const assetName = row['Asset Name'] || '';
    const parentAssetId = row['Parent Asset ID'];
    const locationName = row['Location Name'] || '';
    const category = row['Category'] || row['Asset Type'] || ''; // Check both possible column names
    const make = row['Make'] || '';
    const model = row['Model'] || '';
    const serialNumber = row['Serial Number'] || '';
    const status = row['Machine Status'] || '';
    
    stats.totalAssets++;
    
    // Skip if no asset ID
    if (!assetId) return;
    
    // Standardize the asset type
    const standardizedType = standardizeAssetType(category);
    
    // Determine if this is a room or equipment
    const isTopLevel = parentAssetId === '0' || !parentAssetId;
    const isRoom = standardizedType === 'Room' || 
                   assetName.toLowerCase().includes('room') || 
                   assetName.toLowerCase().includes('booth');
    
    // Standardize room names if applicable
    const cleanedAssetName = isRoom ? standardizeRoomName(assetName) : assetName;
    
    if (isTopLevel) {
      stats.topLevelAssets++;
    }
    if (isRoom) {
      stats.roomAssets++;
    }
    
    // Only process actual equipment (not rooms)
    if (!isRoom) {
      const equipmentType = determineEquipmentType(category, assetName, model);
      
      // Track equipment type stats
      stats.equipmentTypeCount[equipmentType] = (stats.equipmentTypeCount[equipmentType] || 0) + 1;
      
      const mapping = {
        assetId: assetId.toString(),
        name: cleanedAssetName,
        equipmentType,
        category: cleanCategory(category),
        standardizedType,
        make,
        model,
        serialNumber,
        locationName,
        locationCode: extractLocationCode(cleanedAssetName),
        parentAssetId: parentAssetId ? parentAssetId.toString() : null,
        status: status.toLowerCase() === 'up' ? 'operational' : 'needs_service'
      };
      
      equipmentMappings.push(mapping);
      
      // Group by location
      if (!equipmentByLocation[locationName]) {
        equipmentByLocation[locationName] = [];
      }
      equipmentByLocation[locationName].push(mapping);
    }
  });
  
  // Generate output files
  const outputDir = path.join(__dirname, '..', 'data', 'equipment-mappings');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // Save full equipment mappings
  const mappingsPath = path.join(outputDir, 'equipment-mappings.json');
  fs.writeFileSync(mappingsPath, JSON.stringify(equipmentMappings, null, 2));
  console.log(`\nSaved equipment mappings to: ${mappingsPath}`);
  
  // Save equipment by location
  const byLocationPath = path.join(outputDir, 'equipment-by-location.json');
  fs.writeFileSync(byLocationPath, JSON.stringify(equipmentByLocation, null, 2));
  console.log(`Saved equipment by location to: ${byLocationPath}`);
  
  // Generate a simple ID to type mapping for quick lookups
  const idToTypeMap = {};
  equipmentMappings.forEach(eq => {
    idToTypeMap[eq.assetId] = {
      type: eq.equipmentType,
      name: eq.name
    };
  });
  
  const idMapPath = path.join(outputDir, 'asset-id-to-type.json');
  fs.writeFileSync(idMapPath, JSON.stringify(idToTypeMap, null, 2));
  console.log(`Saved ID to type mapping to: ${idMapPath}`);
  
  // Save location mappings
  const locationMapPath = path.join(outputDir, 'location-mappings.json');
  fs.writeFileSync(locationMapPath, JSON.stringify(LOCATION_MAP, null, 2));
  console.log(`Saved location mappings to: ${locationMapPath}`);
  
  // Print summary statistics
  console.log('\n=== Processing Summary ===');
  console.log(`Total assets processed: ${stats.totalAssets}`);
  console.log(`Top-level assets: ${stats.topLevelAssets}`);
  console.log(`Room assets: ${stats.roomAssets}`);
  console.log(`Equipment assets: ${equipmentMappings.length}`);
  console.log('\nEquipment by type:');
  Object.entries(stats.equipmentTypeCount)
    .sort((a, b) => b[1] - a[1])
    .forEach(([type, count]) => {
      console.log(`  ${type}: ${count}`);
    });
  console.log('\nEquipment by location:');
  Object.entries(equipmentByLocation).forEach(([location, equipment]) => {
    console.log(`  ${location}: ${equipment.length} items`);
  });
  
  return {
    mappings: equipmentMappings,
    byLocation: equipmentByLocation,
    idToType: idToTypeMap,
    stats
  };
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Usage: node process-limble-assets.js <path-to-limble-assets.xlsx>');
    console.log('\nExample:');
    console.log('  node process-limble-assets.js "C:\\Users\\ambri\\Downloads\\Limble Assets.xlsx"');
    process.exit(1);
  }
  
  const filePath = args[0];
  
  if (!fs.existsSync(filePath)) {
    console.error(`Error: File not found: ${filePath}`);
    process.exit(1);
  }
  
  try {
    await processLimbleAssets(filePath);
    console.log('\n✅ Processing complete!');
  } catch (error) {
    console.error('Error processing file:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${__filename}`) {
  main();
}

export { processLimbleAssets, determineEquipmentType, CATEGORY_TO_TYPE_MAP };