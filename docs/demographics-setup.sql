-- =====================================================
-- DEMOGRAPHICS COLLECTION
-- Optional user demographic info for aggregate reporting
-- =====================================================

-- Add demographics columns to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('male', 'female', 'non_binary', 'prefer_not_to_say', 'other')),
ADD COLUMN IF NOT EXISTS age_range TEXT CHECK (age_range IN ('under_18', '18_24', '25_34', '35_44', '45_54', '55_64', '65_plus', 'prefer_not_to_say')),
ADD COLUMN IF NOT EXISTS occupation TEXT CHECK (occupation IN (
  'student',
  'employed_full_time',
  'employed_part_time',
  'self_employed',
  'freelancer',
  'homemaker',
  'retired',
  'unemployed',
  'prefer_not_to_say',
  'other'
)),
ADD COLUMN IF NOT EXISTS race_ethnicity TEXT CHECK (race_ethnicity IN (
  'american_indian_alaska_native',
  'asian',
  'black_african_american',
  'hispanic_latino',
  'middle_eastern_north_african',
  'native_hawaiian_pacific_islander',
  'white',
  'multiracial',
  'prefer_not_to_say',
  'other'
)),
ADD COLUMN IF NOT EXISTS marital_status TEXT CHECK (marital_status IN (
  'single',
  'married',
  'domestic_partnership',
  'divorced',
  'separated',
  'widowed',
  'prefer_not_to_say'
)),
ADD COLUMN IF NOT EXISTS demographics_completed_at TIMESTAMP WITH TIME ZONE;

-- Create index for demographics queries
CREATE INDEX IF NOT EXISTS idx_profiles_demographics ON profiles(gender, age_range, occupation, race_ethnicity, marital_status);

-- =====================================================
-- PRIVACY & CONSENT
-- =====================================================

-- Users can update their own demographics
-- Already covered by existing "Users can update own profile" policy

-- Admins can view aggregated demographics (not individual)
-- We'll create a separate view for this

CREATE OR REPLACE VIEW demographics_summary AS
SELECT 
  -- Gender distribution
  gender,
  COUNT(*) FILTER (WHERE gender IS NOT NULL) as gender_count,
  
  -- Age range distribution
  age_range,
  COUNT(*) FILTER (WHERE age_range IS NOT NULL) as age_range_count,
  
  -- Occupation distribution
  occupation,
  COUNT(*) FILTER (WHERE occupation IS NOT NULL) as occupation_count,
  
  -- Race/ethnicity distribution
  race_ethnicity,
  COUNT(*) FILTER (WHERE race_ethnicity IS NOT NULL) as race_ethnicity_count,
  
  -- Marital status distribution
  marital_status,
  COUNT(*) FILTER (WHERE marital_status IS NOT NULL) as marital_status_count,
  
  -- Overall completion stats
  COUNT(*) FILTER (WHERE demographics_completed_at IS NOT NULL) as completed_count,
  COUNT(*) as total_users
FROM profiles
GROUP BY gender, age_range, occupation, race_ethnicity, marital_status;

-- Function to get demographics breakdown (admin only)
CREATE OR REPLACE FUNCTION get_demographics_breakdown()
RETURNS TABLE (
  category TEXT,
  value TEXT,
  count BIGINT,
  percentage NUMERIC
) AS $$
BEGIN
  -- Gender breakdown
  RETURN QUERY
  SELECT 
    'gender'::TEXT as category,
    COALESCE(gender, 'not_provided')::TEXT as value,
    COUNT(*)::BIGINT as count,
    ROUND((COUNT(*)::NUMERIC / NULLIF((SELECT COUNT(*) FROM profiles), 0)) * 100, 2) as percentage
  FROM profiles
  GROUP BY gender;

  -- Age range breakdown
  RETURN QUERY
  SELECT 
    'age_range'::TEXT as category,
    COALESCE(age_range, 'not_provided')::TEXT as value,
    COUNT(*)::BIGINT as count,
    ROUND((COUNT(*)::NUMERIC / NULLIF((SELECT COUNT(*) FROM profiles), 0)) * 100, 2) as percentage
  FROM profiles
  GROUP BY age_range;

  -- Occupation breakdown
  RETURN QUERY
  SELECT 
    'occupation'::TEXT as category,
    COALESCE(occupation, 'not_provided')::TEXT as value,
    COUNT(*)::BIGINT as count,
    ROUND((COUNT(*)::NUMERIC / NULLIF((SELECT COUNT(*) FROM profiles), 0)) * 100, 2) as percentage
  FROM profiles
  GROUP BY occupation;

  -- Race/ethnicity breakdown
  RETURN QUERY
  SELECT 
    'race_ethnicity'::TEXT as category,
    COALESCE(race_ethnicity, 'not_provided')::TEXT as value,
    COUNT(*)::BIGINT as count,
    ROUND((COUNT(*)::NUMERIC / NULLIF((SELECT COUNT(*) FROM profiles), 0)) * 100, 2) as percentage
  FROM profiles
  GROUP BY race_ethnicity;

  -- Marital status breakdown
  RETURN QUERY
  SELECT 
    'marital_status'::TEXT as category,
    COALESCE(marital_status, 'not_provided')::TEXT as value,
    COUNT(*)::BIGINT as count,
    ROUND((COUNT(*)::NUMERIC / NULLIF((SELECT COUNT(*) FROM profiles), 0)) * 100, 2) as percentage
  FROM profiles
  GROUP BY marital_status;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to authenticated users (admin check will be in app layer)
GRANT EXECUTE ON FUNCTION get_demographics_breakdown() TO authenticated;

-- =====================================================
-- COMPLETION TRACKING
-- =====================================================

-- Trigger to set completion timestamp when demographics are filled
CREATE OR REPLACE FUNCTION set_demographics_completion()
RETURNS TRIGGER AS $$
BEGIN
  -- If any demographic field is being set and completion timestamp is null
  IF (NEW.gender IS NOT NULL OR 
      NEW.age_range IS NOT NULL OR 
      NEW.occupation IS NOT NULL OR 
      NEW.race_ethnicity IS NOT NULL OR 
      NEW.marital_status IS NOT NULL) AND 
     OLD.demographics_completed_at IS NULL THEN
    NEW.demographics_completed_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS demographics_completion_trigger ON profiles;
CREATE TRIGGER demographics_completion_trigger
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION set_demographics_completion();

-- =====================================================
-- DONE!
-- Users can now optionally provide demographics
-- Admins can view aggregate reports (not individual data)
-- =====================================================
