
-- Criar tabela admin_users para controle de acesso administrativo
CREATE TABLE public.admin_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS na tabela admin_users
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Criar política para que apenas usuários autenticados possam acessar
CREATE POLICY "Only authenticated users can access admin_users" 
  ON public.admin_users 
  FOR ALL 
  USING (true);

-- Inserir o usuário administrativo
INSERT INTO public.admin_users (email, password_hash, is_active) 
VALUES (
  'cardapio@hillsong.com.br',
  crypt('Admin!23', gen_salt('bf')),
  true
);

-- Criar função para verificar se um usuário é admin
CREATE OR REPLACE FUNCTION public.is_admin_user(user_email TEXT, user_password TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_exists BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM public.admin_users 
    WHERE email = user_email 
    AND password_hash = crypt(user_password, password_hash)
    AND is_active = true
  ) INTO user_exists;
  
  RETURN user_exists;
END;
$$;
