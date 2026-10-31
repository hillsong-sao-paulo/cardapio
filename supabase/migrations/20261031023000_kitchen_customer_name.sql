-- The kitchen ticket keeps the name of the person picking up the order.
-- The public order board still shows only the number.

ALTER TABLE canteen.kitchen_orders
  ADD COLUMN customer_name text;

ALTER TABLE canteen.kitchen_orders
  ADD CONSTRAINT kitchen_orders_customer_name_length
  CHECK (
    customer_name IS NULL
    OR (
      char_length(customer_name) BETWEEN 1 AND 60
      AND customer_name = btrim(customer_name)
    )
  );

COMMENT ON COLUMN canteen.kitchen_orders.customer_name IS
  'Name written at the counter. Shown in the kitchen next to the order number.';

DROP FUNCTION canteen.create_sale(text, jsonb);

CREATE FUNCTION canteen.create_sale(store_slug text, lines jsonb, customer_name text)
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
  v_line_count integer;
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

  INSERT INTO canteen.sales (store_id, total)
  VALUES (v_store.id, 0)
  RETURNING id INTO v_sale_id;

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

    INSERT INTO canteen.sale_items (
      sale_id,
      menu_item_id,
      quantity,
      unit_price,
      subtotal,
      options_label
    )
    VALUES (v_sale_id, v_item_id, v_quantity, 0, 0, v_label);
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

CREATE OR REPLACE FUNCTION canteen.list_kitchen_orders(store_slug text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
  v_store_id uuid;
  v_orders jsonb;
BEGIN
  v_store_id = canteen_private.active_store_id(store_slug);
  IF v_store_id IS NULL THEN
    RAISE EXCEPTION 'Store not found';
  END IF;

  SELECT COALESCE(
    jsonb_agg(row_payload ORDER BY sort_at DESC),
    '[]'::jsonb
  )
  INTO v_orders
  FROM (
    SELECT
      k.created_at AS sort_at,
      jsonb_build_object(
        'id', k.id,
        'order_number', k.order_number,
        'customer_name', k.customer_name,
        'status', k.status,
        'created_at', k.created_at,
        'ready_at', k.ready_at,
        'total_items', k.total_items,
        'items', COALESCE((
          SELECT jsonb_agg(
            jsonb_build_object(
              'id', i.id,
              'menu_item_id', i.menu_item_id,
              'menu_item_name', i.menu_item_name,
              'quantity', i.quantity,
              'options_label', i.options_label
            )
            ORDER BY i.created_at
          )
          FROM canteen.kitchen_order_items i
          WHERE i.kitchen_order_id = k.id
        ), '[]'::jsonb)
      ) AS row_payload
    FROM canteen.kitchen_orders k
    WHERE k.store_id = v_store_id
      AND (
        k.status = 'new'
        OR (
          k.status = 'ready'
          AND k.ready_at > now() - interval '36 hours'
        )
      )
    ORDER BY k.created_at DESC
    LIMIT 200
  ) recent;

  RETURN jsonb_build_object(
    'store_id', v_store_id,
    'orders', v_orders
  );
END;
$$;


GRANT EXECUTE ON FUNCTION canteen.create_sale(text, jsonb, text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION canteen.list_kitchen_orders(text) TO anon, authenticated, service_role;
