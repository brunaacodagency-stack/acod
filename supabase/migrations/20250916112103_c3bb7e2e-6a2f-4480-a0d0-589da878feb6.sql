-- Update content_type enum to only include static, carousel, reels
ALTER TYPE content_type ADD VALUE IF NOT EXISTS 'estatico';
ALTER TYPE content_type ADD VALUE IF NOT EXISTS 'carrossel';
ALTER TYPE content_type ADD VALUE IF NOT EXISTS 'reels';

-- Update capture_type enum 
ALTER TYPE capture_type ADD VALUE IF NOT EXISTS 'pela_agencia';
ALTER TYPE capture_type ADD VALUE IF NOT EXISTS 'pelo_cliente';

-- Add role column to profiles table for access control
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role text DEFAULT 'cliente' CHECK (role IN ('cliente', 'agencia'));

-- Update profiles table to have proper role defaults
UPDATE public.profiles SET role = 'agencia' WHERE role IS NULL;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_contents_user_id ON public.contents(user_id);
CREATE INDEX IF NOT EXISTS idx_contents_date ON public.contents(date);