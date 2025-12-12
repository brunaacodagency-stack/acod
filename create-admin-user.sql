-- Script temporário para verificar e recriar o usuário admin
-- Execute este script no SQL Editor do Supabase Dashboard

-- 1. Verificar se o perfil existe
SELECT * FROM public.profiles WHERE email = 'bruna.acodagency@gmail.com';

-- 2. Se não existir perfil, você precisará:
--    a) Ir em Authentication -> Users no Supabase Dashboard
--    b) Clicar em "Add user" -> "Create new user"
--    c) Email: bruna.acodagency@gmail.com
--    d) Password: [escolha uma senha]
--    e) Marcar "Auto Confirm User" para não precisar confirmar email
--    f) Depois de criar, copie o USER_ID que aparece

-- 3. Após criar o usuário no Auth, execute este comando substituindo USER_ID:
-- INSERT INTO public.profiles (user_id, email, role, display_name)
-- VALUES ('USER_ID_AQUI', 'bruna.acodagency@gmail.com', 'agencia', 'Bruna');
