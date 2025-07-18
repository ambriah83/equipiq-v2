-- Create equipment types for existing equipment models if they don't exist
-- This migration ensures compatibility between the two schemas

-- Insert equipment types based on existing equipment models
INSERT INTO equipment_types (name, description)
SELECT DISTINCT 
  model_name,
  CONCAT('Equipment type for ', model_name, ' by ', manufacturers.name)
FROM equipment_models
JOIN equipment_manufacturers manufacturers ON equipment_models.manufacturer_id = manufacturers.id
WHERE NOT EXISTS (
  SELECT 1 FROM equipment_types WHERE name = equipment_models.model_name
);

-- Add a reference column to link equipment models to equipment types
ALTER TABLE equipment_models ADD COLUMN IF NOT EXISTS equipment_type_id UUID REFERENCES equipment_types(id);

-- Update the reference for existing models
UPDATE equipment_models
SET equipment_type_id = equipment_types.id
FROM equipment_types
WHERE equipment_models.model_name = equipment_types.name;

-- Create an index for faster lookups
CREATE INDEX IF NOT EXISTS idx_equipment_models_type_id ON equipment_models(equipment_type_id); 