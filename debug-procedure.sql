-- Create stored procedure to bypass RLS for debugging
CREATE OR REPLACE FUNCTION get_all_company_knowledge()
RETURNS SETOF company_knowledge
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM company_knowledge
  ORDER BY created_at DESC;
END;
$$ LANGUAGE plpgsql;