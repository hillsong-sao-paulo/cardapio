-- A second identical checkout that starts while the first is still being saved
-- returns the ticket already created. The store row lock makes the extra
-- calls wait, then they see the committed sale and do not take stock again.

CREATE OR REPLACE FUNCTION canteen.create_sale(store_slug text, lines jsonb, customer_name text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
  v_store canteen.stores%ROWTYPE;
  v_sale_id uuid;
  v_line jsonb;
  v_item_id uuid;
  v_quantity integer;
  v_seen text[] := ARRAY[]::text[];
  v_ids uuid[] := ARRAY[]::uuid[];
  v_qtys integer[] := ARRAY[]::integer[];
  v_labels text[] := ARRAY[]::text[];
  v_line_count integer;
  v_index integer;
  v_signature text;
  v_kitchen_id uuid;
  v_order_number integer;
  v_total numeric(10, 2);
  v_profile text;
  v_label text;
  v_key text;
  v_removed jsonb;
  v_name text;
BEGIN
  IF store_slug IS NULL OR lines IS NULL OR jsonb_typeof(lines) <> 'array' THEN
    RAISE EXCEPTION 'Store slug and a list of lines are required';
  END IF;

  v_line_count = jsonb_array_length(lines);
  IF v_line_count < 1 OR v_line_count > 40 THEN
    RAISE EXCEPTION 'A sale needs between 1 and 40 lines';
  END IF;

  v_name := regexp_replace(btrim(customer_name), '[[:space:]]+', ' ', 'g');
  IF v_name IS NULL OR v_name = '' THEN
    RAISE EXCEPTION 'Customer name is required';
  END IF;
  IF char_length(v_name) > 60 THEN
    RAISE EXCEPTION 'Customer name is too long';
  END IF;

  SELECT *
  INTO v_store
  FROM canteen.stores
  WHERE slug = store_slug
    AND is_active
  FOR UPDATE;

  IF v_store.id IS NULL THEN
    RAISE EXCEPTION 'Store not found';
  END IF;

  FOR v_line IN
    SELECT value
    FROM jsonb_array_elements(lines)
    ORDER BY value ->> 'menu_item_id'
  LOOP
    BEGIN
      v_item_id = (v_line ->> 'menu_item_id')::uuid;
    EXCEPTION
      WHEN invalid_text_representation THEN
        RAISE EXCEPTION 'Invalid menu item id';
    END;

    IF v_item_id IS NULL THEN
      RAISE EXCEPTION 'Invalid menu item id';
    END IF;

    IF char_length(COALESCE(v_line ->> 'quantity', '')) > 2
      OR COALESCE(v_line ->> 'quantity', '') !~ '^[0-9]+$' THEN
      RAISE EXCEPTION 'Quantity must be a whole number from 1 to 99';
    END IF;

    v_quantity = (v_line ->> 'quantity')::integer;
    IF v_quantity < 1 OR v_quantity > 99 THEN
      RAISE EXCEPTION 'Quantity must be between 1 and 99';
    END IF;

    SELECT m.option_profile
    INTO v_profile
    FROM canteen.menu_items m
    WHERE m.id = v_item_id;

    v_removed := v_line -> 'removed';
    v_label := canteen_private.sale_option_label(
      v_profile,
      v_line ->> 'drink',
      v_line ->> 'doneness',
      CASE WHEN v_removed IS NULL THEN '[]'::jsonb ELSE v_removed END
    );

    v_key := v_item_id::text || '|' || coalesce(v_label, '');
    IF v_key = ANY (v_seen) THEN
      RAISE EXCEPTION 'Duplicate menu item in the same sale';
    END IF;
    v_seen := v_seen || v_key;
    v_ids := v_ids || ARRAY[v_item_id];
    v_qtys := v_qtys || ARRAY[v_quantity];
    v_labels := v_labels || ARRAY[v_label];
  END LOOP;

  SELECT coalesce(string_agg(
    item_id::text || ':' || qty::text || ':' || coalesce(label, ''),
    '|' ORDER BY item_id::text, coalesce(label, ''), qty
  ), '')
  INTO v_signature
  FROM unnest(v_ids, v_qtys, v_labels) AS parsed(item_id, qty, label);

  -- now() is the start of this call. Parallel checkouts from one tap share
  -- that instant, so the calls that wait on the store lock still match.
  SELECT s.id, k.id, k.order_number, s.total
  INTO v_sale_id, v_kitchen_id, v_order_number, v_total
  FROM canteen.kitchen_orders k
  JOIN canteen.sales s ON s.id = k.sale_id
  WHERE k.store_id = v_store.id
    AND k.customer_name = v_name
    AND k.created_at > now() - interval '4 seconds'
    AND (
      SELECT count(*)
      FROM canteen.sale_items si
      WHERE si.sale_id = s.id
    ) = v_line_count
    AND (
      SELECT coalesce(string_agg(
        si.menu_item_id::text || ':' || si.quantity::text || ':' || coalesce(si.options_label, ''),
        '|' ORDER BY si.menu_item_id::text, coalesce(si.options_label, ''), si.quantity
      ), '')
      FROM canteen.sale_items si
      WHERE si.sale_id = s.id
    ) = v_signature
  ORDER BY k.created_at
  LIMIT 1;

  IF v_sale_id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'sale_id', v_sale_id,
      'kitchen_order_id', v_kitchen_id,
      'order_number', v_order_number,
      'total', v_total
    );
  END IF;

  INSERT INTO canteen.sales (store_id, total)
  VALUES (v_store.id, 0)
  RETURNING id INTO v_sale_id;

  FOR v_index IN 1 .. v_line_count LOOP
    INSERT INTO canteen.sale_items (
      sale_id,
      menu_item_id,
      quantity,
      unit_price,
      subtotal,
      options_label
    )
    VALUES (v_sale_id, v_ids[v_index], v_qtys[v_index], 0, 0, v_labels[v_index]);
  END LOOP;

  INSERT INTO canteen.kitchen_orders (
    store_id,
    sale_id,
    status,
    total_items,
    customer_name
  )
  VALUES (
    v_store.id,
    v_sale_id,
    'new',
    (
      SELECT COALESCE(sum(si.quantity), 0)::integer
      FROM canteen.sale_items si
      WHERE si.sale_id = v_sale_id
    ),
    v_name
  )
  RETURNING id, order_number INTO v_kitchen_id, v_order_number;

  INSERT INTO canteen.kitchen_order_items (
    kitchen_order_id,
    menu_item_id,
    menu_item_name,
    quantity,
    options_label
  )
  SELECT
    v_kitchen_id,
    si.menu_item_id,
    mi.name,
    si.quantity,
    si.options_label
  FROM canteen.sale_items si
  JOIN canteen.menu_items mi ON mi.id = si.menu_item_id
  WHERE si.sale_id = v_sale_id;

  SELECT s.total
  INTO v_total
  FROM canteen.sales s
  WHERE s.id = v_sale_id;

  RETURN jsonb_build_object(
    'sale_id', v_sale_id,
    'kitchen_order_id', v_kitchen_id,
    'order_number', v_order_number,
    'total', v_total
  );
END;
$$;

COMMENT ON FUNCTION canteen.create_sale(text, jsonb, text) IS
  'Creates a sale for one active store, decreases that store stock, and opens a kitchen ticket. An identical checkout that started in the last 4 seconds returns the existing ticket.';

GRANT EXECUTE ON FUNCTION canteen.create_sale(text, jsonb, text) TO anon, authenticated, service_role;
