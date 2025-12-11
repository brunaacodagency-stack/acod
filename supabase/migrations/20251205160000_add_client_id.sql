ttALTER TABLE public.contents ADD COLUMN client_id uuid REFERENCES auth.users(id);
-- Enable filtering by client_id automatically for clients
ALTER POLICY "Enable read access for all users" ON "public"."contents"
USING (
  (auth.uid() = user_id) -- Creator (Agency) can see
  OR 
  (auth.uid() = client_id) -- Assigned Client can see
  OR
  (EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = 'agencia'
  )) -- Any Agency user can see everything (conceptually, though RLS might need refinement)
);