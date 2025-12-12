-- 1. Limpar perfis órfãos (que não têm usuário correspondente no Auth)
DELETE FROM public.profiles
WHERE user_id NOT IN (SELECT id FROM auth.users);

-- 2. Adicionar a chave estrangeira (Foreign Key) para garantir integridade
-- Isso fará com que, ao deletar um usuário no Auth, o perfil seja deletado automaticamente (Cascade)
ALTER TABLE public.profiles
ADD CONSTRAINT profiles_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES auth.users(id)
ON DELETE CASCADE;
