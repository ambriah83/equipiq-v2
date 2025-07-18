// scripts/test-limble-processing.js
// Test the Limble asset processing functions without needing the Excel file

import { determineEquipmentType, CATEGORY_TO_TYPE_MAP } from './process-limble-assets.js';

// Test equipment type detection
const testCases = [
  { category: '<font color="#efa131">Sun</font>', name: 'Ergoline Affinity 950', model: '', expected: 'sun_bed' },
  { category: '<font color="#4684d0">Spa</font>', name: 'Beauty Angel 7200#14 EW', model: '', expected: 'spray_booth' },
  { category: '<font color="#c22528">Spray</font>', name: 'VersaSpa Pro #16 EW', model: '', expected: 'spray_booth' },
  { category: 'Sun', name: 'KBL 8000ES #27 EW', model: '', expected: 'sun_bed' },
  { category: '', name: 'Cocoon #16 EW', model: '', expected: 'wellness_pod' },
  { category: '', name: 'Red Light Therapy Unit', model: '', expected: 'red_light_therapy' },
  { category: '', name: 'HydraFacial MD', model: '', expected: 'hydration_station' },
  { category: '', name: 'Some Unknown Equipment', model: '', expected: 'general_equipment' }
];

console.log('Testing Equipment Type Detection:\n');
console.log('Category | Name | Expected | Result | ✓/✗');
console.log('---------|------|----------|--------|----');

testCases.forEach(test => {
  const result = determineEquipmentType(test.category, test.name, test.model);
  const passed = result === test.expected;
  console.log(`${test.category.substring(0, 20).padEnd(20)} | ${test.name.substring(0, 30).padEnd(30)} | ${test.expected.padEnd(20)} | ${result.padEnd(20)} | ${passed ? '✓' : '✗'}`);
});

console.log('\n\nAvailable Equipment Types:');
Object.entries(CATEGORY_TO_TYPE_MAP).forEach(([category, type]) => {
  console.log(`  ${category.padEnd(15)} → ${type}`);
});