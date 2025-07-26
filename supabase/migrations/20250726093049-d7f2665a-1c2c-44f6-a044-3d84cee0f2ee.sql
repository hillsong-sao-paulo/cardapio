
-- Adicionar campo name na tabela admin_users se não existir
ALTER TABLE public.admin_users 
ADD COLUMN IF NOT EXISTS name text;

-- Criar função para atualizar perfil do usuário
CREATE OR REPLACE FUNCTION public.update_admin_profile(
  user_id uuid,
  new_name text,
  new_email text
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  email_exists boolean;
BEGIN
  -- Verificar se o email já existe para outro usuário
  SELECT EXISTS(
    SELECT 1 FROM public.admin_users 
    WHERE email = new_email AND id != user_id
  ) INTO email_exists;
  
  IF email_exists THEN
    RAISE EXCEPTION 'Email já está em uso por outro usuário';
  END IF;
  
  -- Atualizar os dados do perfil
  UPDATE public.admin_users 
  SET 
    name = new_name,
    email = new_email,
    updated_at = now()
  WHERE id = user_id AND is_active = true;
  
  RETURN FOUND;
END;
$$;

-- Criar função para alterar senha
CREATE OR REPLACE FUNCTION public.change_admin_password(
  user_id uuid,
  current_password text,
  new_password text
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  password_valid boolean;
BEGIN
  -- Verificar se a senha atual está correta
  SELECT EXISTS(
    SELECT 1 FROM public.admin_users 
    WHERE id = user_id 
    AND password_hash = crypt(current_password, password_hash)
    AND is_active = true
  ) INTO password_valid;
  
  IF NOT password_valid THEN
    RAISE EXCEPTION 'Senha atual incorreta';
  END IF;
  
  -- Atualizar a senha
  UPDATE public.admin_users 
  SET 
    password_hash = crypt(new_password, gen_salt('bf')),
    updated_at = now()
  WHERE id = user_id AND is_active = true;
  
  RETURN FOUND;
END;
$$;

-- Criar função para obter dados do perfil do usuário
CREATE OR REPLACE FUNCTION public.get_admin_profile(user_id uuid)
RETURNS TABLE(
  id uuid,
  name text,
  email text,
  created_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    au.id,
    au.name,
    au.email,
    au.created_at
  FROM public.admin_users au
  WHERE au.id = user_id AND au.is_active = true;
END;
$$;
