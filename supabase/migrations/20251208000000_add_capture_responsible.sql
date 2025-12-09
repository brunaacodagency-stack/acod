ALTER TABLE public.contents ADD COLUMN capture_responsible TEXT DEFAULT 's_necessidade';
-- Optionally validate the values if needed, but text is flexible
-- CHECK (capture_responsible IN ('s_necessidade', 'pela_agencia', 'pelo_cliente'))
