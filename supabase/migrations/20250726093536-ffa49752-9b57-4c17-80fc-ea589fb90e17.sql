
-- Inserir usuário administrador padrão se não existir
INSERT INTO public.admin_users (email, name, password_hash, is_active)
SELECT 
  'admin@hillsong.com',
  'Administrador',
  crypt('admin123', gen_salt('bf')),
  true
WHERE NOT EXISTS (
  SELECT 1 FROM public.admin_users WHERE email = 'admin@hillsong.com'
);
