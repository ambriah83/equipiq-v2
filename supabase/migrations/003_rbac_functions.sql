-- Create function to check if user is admin (owner or manager)
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('owner', 'manager')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get user role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
DECLARE
  user_role_value TEXT;
BEGIN
  SELECT role::TEXT INTO user_role_value
  FROM profiles
  WHERE id = auth.uid();
  
  RETURN COALESCE(user_role_value, 'staff');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update RLS policies to use role-based access instead of hardcoded email
-- Drop existing email-based policies
DROP POLICY IF EXISTS "Admin can manage improvement cases" ON improvement_cases;
DROP POLICY IF EXISTS "Admin can manage fine-tuning jobs" ON fine_tuning_jobs;

-- Create new role-based policies for improvement cases
CREATE POLICY "Admin can manage improvement cases" ON improvement_cases
  FOR ALL USING (is_admin());

-- Create new role-based policies for fine-tuning jobs
CREATE POLICY "Admin can manage fine-tuning jobs" ON fine_tuning_jobs
  FOR ALL USING (is_admin());

-- Create policy for knowledge management
CREATE POLICY "Admin can manage knowledge chunks" ON knowledge_chunks
  FOR ALL USING (is_admin());

CREATE POLICY "Admin can manage equipment types" ON equipment_types
  FOR ALL USING (is_admin());

-- Ensure the admin user has the correct role
-- First, create a profile for the admin user if it doesn't exist
INSERT INTO profiles (id, role)
SELECT id, 'owner'::user_role
FROM auth.users
WHERE email = 'ambriahatcher@gmail.com'
ON CONFLICT (id) DO UPDATE
SET role = 'owner'::user_role;