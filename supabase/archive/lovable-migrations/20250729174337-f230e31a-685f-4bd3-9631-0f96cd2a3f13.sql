
-- Criar tabela para pedidos da cozinha
CREATE TABLE public.kitchen_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sale_id UUID REFERENCES public.sales(id) ON DELETE CASCADE,
  order_number INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'ready')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ready_at TIMESTAMP WITH TIME ZONE NULL,
  total_items INTEGER NOT NULL DEFAULT 0
);

-- Criar tabela para itens dos pedidos da cozinha
CREATE TABLE public.kitchen_order_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  kitchen_order_id UUID REFERENCES public.kitchen_orders(id) ON DELETE CASCADE,
  menu_item_id UUID REFERENCES public.menu_items(id),
  menu_item_name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar Row Level Security
ALTER TABLE public.kitchen_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kitchen_order_items ENABLE ROW LEVEL SECURITY;

-- Criar políticas para acesso público (cozinha não precisa de autenticação)
CREATE POLICY "Allow public read access on kitchen_orders" 
  ON public.kitchen_orders 
  FOR SELECT 
  USING (true);

CREATE POLICY "Allow public write access on kitchen_orders" 
  ON public.kitchen_orders 
  FOR ALL 
  USING (true);

CREATE POLICY "Allow public read access on kitchen_order_items" 
  ON public.kitchen_order_items 
  FOR SELECT 
  USING (true);

CREATE POLICY "Allow public write access on kitchen_order_items" 
  ON public.kitchen_order_items 
  FOR ALL 
  USING (true);

-- Criar índices para performance
CREATE INDEX idx_kitchen_orders_status ON public.kitchen_orders(status);
CREATE INDEX idx_kitchen_orders_created_at ON public.kitchen_orders(created_at);
CREATE INDEX idx_kitchen_order_items_kitchen_order_id ON public.kitchen_order_items(kitchen_order_id);

-- Habilitar realtime para atualizações automáticas
ALTER TABLE public.kitchen_orders REPLICA IDENTITY FULL;
ALTER TABLE public.kitchen_order_items REPLICA IDENTITY FULL;

-- Adicionar tabelas à publicação do realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.kitchen_orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.kitchen_order_items;

-- Criar sequência para números de pedidos
CREATE SEQUENCE public.kitchen_order_number_seq START 1;

-- Criar trigger para gerar números de pedidos automaticamente
CREATE OR REPLACE FUNCTION public.generate_kitchen_order_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.order_number := nextval('public.kitchen_order_number_seq');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_generate_kitchen_order_number
  BEFORE INSERT ON public.kitchen_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_kitchen_order_number();

-- Criar trigger para atualizar ready_at quando status muda para 'ready'
CREATE OR REPLACE FUNCTION public.update_kitchen_order_ready_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'ready' AND OLD.status != 'ready' THEN
    NEW.ready_at := now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_kitchen_order_ready_at
  BEFORE UPDATE ON public.kitchen_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_kitchen_order_ready_at();
