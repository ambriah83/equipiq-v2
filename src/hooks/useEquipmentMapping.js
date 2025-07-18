// src/hooks/useEquipmentMapping.js
// Hook to handle equipment type mappings from Limble asset IDs

import { useState, useEffect } from 'react';

// Default mappings (will be overridden by loaded data)
const DEFAULT_MAPPINGS = {
  // Common equipment patterns
  patterns: {
    'versa': 'spray_booth',
    'mystic': 'spray_booth',
    'pura': 'spray_booth',
    'sun': 'sun_bed',
    'tan': 'sun_bed',
    'cocoon': 'wellness_pod',
    'hydra': 'hydration_station',
    'red light': 'red_light_therapy',
    'sauna': 'sauna',
    'cryo': 'cryotherapy',
    'float': 'float_tank'
  }
};

export function useEquipmentMapping() {
  const [assetIdToType, setAssetIdToType] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Try to load mappings from the data directory
    const loadMappings = async () => {
      try {
        // In a real app, this would be an API call or import
        // For now, we'll use the pattern matching
        const response = await fetch('/data/equipment-mappings/asset-id-to-type.json');
        if (response.ok) {
          const data = await response.json();
          setAssetIdToType(data);
        }
      } catch (error) {
        console.log('Using default equipment type mappings');
      } finally {
        setIsLoading(false);
      }
    };

    loadMappings();
  }, []);

  // Get equipment type from asset ID or equipment details
  const getEquipmentType = (assetId, equipment = null) => {
    // First, check if we have a direct mapping
    if (assetId && assetIdToType[assetId]) {
      return assetIdToType[assetId].type;
    }

    // Fallback to pattern matching on equipment name
    if (equipment && equipment.name) {
      const nameLower = equipment.name.toLowerCase();
      
      for (const [pattern, type] of Object.entries(DEFAULT_MAPPINGS.patterns)) {
        if (nameLower.includes(pattern)) {
          return type;
        }
      }
    }

    // Default fallback
    return 'general_equipment';
  };

  // Get user-friendly equipment type name
  const getEquipmentTypeName = (equipmentType) => {
    const typeNames = {
      'sun_bed': 'Sun Bed',
      'spray_booth': 'Spray Tan Booth',
      'red_light_therapy': 'Red Light Therapy',
      'wellness_pod': 'Wellness Pod',
      'hydration_station': 'Hydration Station',
      'massage_equipment': 'Massage Equipment',
      'sauna': 'Sauna',
      'cryotherapy': 'Cryotherapy',
      'float_tank': 'Float Tank',
      'general_equipment': 'General Equipment'
    };

    return typeNames[equipmentType] || 'Equipment';
  };

  return {
    getEquipmentType,
    getEquipmentTypeName,
    isLoading,
    assetIdToType
  };
}