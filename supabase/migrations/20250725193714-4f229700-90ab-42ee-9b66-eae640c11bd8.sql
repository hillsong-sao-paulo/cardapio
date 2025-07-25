
-- Criar tabela de categorias
CREATE TABLE public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de itens do cardápio
CREATE TABLE public.menu_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de vendas
CREATE TABLE public.sales (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  total DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de itens vendidos
CREATE TABLE public.sale_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sale_id UUID REFERENCES public.sales(id) ON DELETE CASCADE,
  menu_item_id UUID REFERENCES public.menu_items(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Inserir categorias existentes
INSERT INTO public.categories (name) VALUES 
  ('Pratos'),
  ('Sobremesa'),
  ('Bebidas'),
  ('Almoço');

-- Inserir itens do cardápio existentes
WITH category_ids AS (
  SELECT id as pratos_id FROM public.categories WHERE name = 'Pratos' UNION ALL
  SELECT id as sobremesa_id FROM public.categories WHERE name = 'Sobremesa' UNION ALL
  SELECT id as bebidas_id FROM public.categories WHERE name = 'Bebidas' UNION ALL
  SELECT id as almoco_id FROM public.categories WHERE name = 'Almoço'
)
INSERT INTO public.menu_items (name, description, price, stock, category_id) VALUES 
  ('KOKABURRA WINGS (5 UNIDADES)', 'Sobreasas de frango empanadas, servidas com molho blue cheese', 25.00, 10, (SELECT id FROM public.categories WHERE name = 'Pratos')),
  ('MINI AUSSIE FRIES', 'Batatas fritas cobertas com molho cheddar ranch e bacon crocante', 25.00, 8, (SELECT id FROM public.categories WHERE name = 'Pratos')),
  ('BILLY RIBS (4 UNIDADES)', 'Costelinhas suínas com molho barbecue ou billabong', 25.00, 6, (SELECT id FROM public.categories WHERE name = 'Pratos')),
  ('COMBINAÇÃO DE BILLY & FRIES', 'Costelinhas suínas acompanhadas de batata frita', 40.00, 5, (SELECT id FROM public.categories WHERE name = 'Pratos')),
  ('COMBINAÇÃO DE WINGS & FRIES', 'Sobreasas de frango empanadas com batata frita', 40.00, 7, (SELECT id FROM public.categories WHERE name = 'Pratos')),
  ('MINI BROWNIE', 'Brownie de chocolate com nozes', 10.00, 15, (SELECT id FROM public.categories WHERE name = 'Sobremesa')),
  ('REFRIGERANTE COCA-COLA', 'Coca-cola normal ou zero', 8.00, 20, (SELECT id FROM public.categories WHERE name = 'Bebidas')),
  ('ICED TEA (500ML)', 'Sabores: limão, cranberry ou pêssego', 13.00, 12, (SELECT id FROM public.categories WHERE name = 'Bebidas')),
  ('STEAK AU GRATIN & ARROZ PILAF + COCA-COLA OU ICE TEA', 'Fatias de filé mignon com molho gorgonzola e purê', 45.00, 4, (SELECT id FROM public.categories WHERE name = 'Almoço'));

-- Habilitar Row Level Security (RLS) para todas as tabelas
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS para permitir acesso público (temporário até implementar autenticação)
CREATE POLICY "Allow public read access on categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Allow public read access on menu_items" ON public.menu_items FOR SELECT USING (true);
CREATE POLICY "Allow public read access on sales" ON public.sales FOR SELECT USING (true);
CREATE POLICY "Allow public read access on sale_items" ON public.sale_items FOR SELECT USING (true);

-- Políticas para operações de escrita (serão refinadas quando implementar autenticação)
CREATE POLICY "Allow public write access on categories" ON public.categories FOR ALL USING (true);
CREATE POLICY "Allow public write access on menu_items" ON public.menu_items FOR ALL USING (true);
CREATE POLICY "Allow public write access on sales" ON public.sales FOR ALL USING (true);
CREATE POLICY "Allow public write access on sale_items" ON public.sale_items FOR ALL USING (true);

-- Habilitar realtime para sincronização
ALTER TABLE public.categories REPLICA IDENTITY FULL;
ALTER TABLE public.menu_items REPLICA IDENTITY FULL;
ALTER TABLE public.sales REPLICA IDENTITY FULL;
ALTER TABLE public.sale_items REPLICA IDENTITY FULL;

-- Adicionar tabelas à publicação de realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.categories;
ALTER PUBLICATION supabase_realtime ADD TABLE public.menu_items;
ALTER PUBLICATION supabase_realtime ADD TABLE public.sales;
ALTER PUBLICATION supabase_realtime ADD TABLE public.sale_items;
