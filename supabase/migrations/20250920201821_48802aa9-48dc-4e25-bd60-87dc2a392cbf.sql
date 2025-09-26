-- Adicionar constraint única no user_id se não existir
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_user_id_unique UNIQUE (user_id);

-- Inserir usuário administrador diretamente sem ON CONFLICT
INSERT INTO public.profiles (
  user_id,
  username,
  full_name,
  role,
  is_active
)
SELECT 
  '12345678-1234-5678-9012-123456789012'::uuid,
  'cardoso',
  'Administrador Cardoso',
  'admin',
  true
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles WHERE username = 'cardoso'
);