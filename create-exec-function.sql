-- Create the exec function that allows running SQL commands
CREATE OR REPLACE FUNCTION exec(query text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE query;
END;
$$;