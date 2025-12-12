-- Fix any invalid role values and ensure constraint works properly

-- 1. Update any NULL or invalid roles to 'cliente'
UPDATE public.profiles 
SET role = 'cliente' 
WHERE role IS NULL OR role NOT IN ('cliente', 'agencia');

-- 2. Drop the old constraint if it exists
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- 3. Recreate the constraint
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('cliente', 'agencia'));
