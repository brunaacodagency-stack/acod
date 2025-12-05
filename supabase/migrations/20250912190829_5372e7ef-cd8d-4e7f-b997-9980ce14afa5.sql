-- Create enum types for better data consistency
CREATE TYPE content_type AS ENUM ('post', 'story', 'reel', 'carrossel', 'video', 'outro');
CREATE TYPE content_status AS ENUM ('pendente', 'em_producao', 'aguardando_aprovacao', 'aprovado', 'rejeitado', 'publicado');
CREATE TYPE approval_status AS ENUM ('indefinido', 'aprovado', 'rejeitado', 'pendente');
CREATE TYPE capture_type AS ENUM ('s_necessidade', 'fotografia', 'video', 'design', 'redacao');

-- Create the main content table
CREATE TABLE public.contents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  date DATE NOT NULL,
  day_of_week TEXT NOT NULL,
  content_type content_type DEFAULT 'post',
  objective TEXT,
  feed_theme TEXT,
  observations TEXT,
  approved_guidelines approval_status DEFAULT 'indefinido',
  content_capture capture_type DEFAULT 's_necessidade',
  content_status content_status DEFAULT 'pendente',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.contents ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own contents" 
ON public.contents 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own contents" 
ON public.contents 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own contents" 
ON public.contents 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own contents" 
ON public.contents 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_contents_updated_at
  BEFORE UPDATE ON public.contents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create profiles table for user management
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  display_name TEXT,
  email TEXT,
  role TEXT DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Profiles are viewable by everyone" 
ON public.profiles 
FOR SELECT 
USING (true);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Add trigger for profiles timestamps
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();