-- Allow agency users to update any profile
-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Create new policies:
-- 1. Users can update their own profile
CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

-- 2. Agency users can update any profile
CREATE POLICY "Agency users can update any profile" 
ON public.profiles 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid()
    AND role = 'agencia'
  )
);
