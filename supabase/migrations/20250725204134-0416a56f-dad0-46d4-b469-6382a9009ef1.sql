
-- Habilitar realtime para a tabela menu_items
ALTER TABLE public.menu_items REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.menu_items;

-- Adicionar constraint para evitar estoque negativo
ALTER TABLE public.menu_items ADD CONSTRAINT check_stock_non_negative CHECK (stock >= 0);

-- Criar função para reduzir estoque de forma atômica
CREATE OR REPLACE FUNCTION public.reduce_menu_item_stock(
  item_id uuid,
  quantity_to_reduce integer
) RETURNS boolean AS $$
DECLARE
  current_stock integer;
BEGIN
  -- Verificar estoque atual e fazer lock da linha
  SELECT stock INTO current_stock
  FROM public.menu_items
  WHERE id = item_id
  FOR UPDATE;
  
  -- Verificar se há estoque suficiente
  IF current_stock IS NULL THEN
    RAISE EXCEPTION 'Item não encontrado';
  END IF;
  
  IF current_stock < quantity_to_reduce THEN
    RAISE EXCEPTION 'Estoque insuficiente. Disponível: %, Solicitado: %', current_stock, quantity_to_reduce;
  END IF;
  
  -- Reduzir o estoque
  UPDATE public.menu_items
  SET stock = stock - quantity_to_reduce,
      updated_at = now()
  WHERE id = item_id;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar função para processar venda com controle de estoque
CREATE OR REPLACE FUNCTION public.process_sale_with_stock_control(
  sale_total numeric,
  sale_items jsonb
) RETURNS uuid AS $$
DECLARE
  new_sale_id uuid;
  item record;
  item_data jsonb;
BEGIN
  -- Criar a venda
  INSERT INTO public.sales (total)
  VALUES (sale_total)
  RETURNING id INTO new_sale_id;
  
  -- Processar cada item da venda
  FOR item_data IN SELECT * FROM jsonb_array_elements(sale_items)
  LOOP
    -- Reduzir estoque usando função segura
    PERFORM public.reduce_menu_item_stock(
      (item_data->>'menu_item_id')::uuid,
      (item_data->>'quantity')::integer
    );
    
    -- Inserir item da venda
    INSERT INTO public.sale_items (
      sale_id,
      menu_item_id,
      quantity,
      unit_price,
      subtotal
    ) VALUES (
      new_sale_id,
      (item_data->>'menu_item_id')::uuid,
      (item_data->>'quantity')::integer,
      (item_data->>'unit_price')::numeric,
      (item_data->>'subtotal')::numeric
    );
  END LOOP;
  
  RETURN new_sale_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
