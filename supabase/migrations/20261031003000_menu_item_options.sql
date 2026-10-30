-- Choices made at the counter: drink flavor, burger doneness, and removed toppings.
-- The sale stores the phrase the kitchen should read. Price and stock stay on the item.

ALTER TABLE canteen.menu_items
  ADD COLUMN option_profile text;

ALTER TABLE canteen.menu_items
  ADD CONSTRAINT menu_items_option_profile_check
  CHECK (option_profile IS NULL OR option_profile IN ('drink', 'burger', 'combo'));

ALTER TABLE canteen.sale_items
  ADD COLUMN options_label text;

ALTER TABLE canteen.sale_items
  ADD CONSTRAINT sale_items_options_label_length
  CHECK (options_label IS NULL OR char_length(options_label) <= 180);

ALTER TABLE canteen.kitchen_order_items
  ADD COLUMN options_label text;

COMMENT ON COLUMN canteen.menu_items.option_profile IS
  'drink, burger, or combo. Null means the item is added with no choices.';
COMMENT ON COLUMN canteen.sale_items.options_label IS
  'Choices for this line, in the phrase shown to the kitchen.';
COMMENT ON COLUMN canteen.kitchen_order_items.options_label IS
  'Copy of the sale line choices, so the kitchen ticket stays readable.';

UPDATE canteen.menu_items
SET option_profile = CASE
  WHEN name ILIKE '%combo%' THEN 'combo'
  WHEN name ILIKE '%burguer%'
    OR name ILIKE '%burger%'
    OR name ILIKE '%hamburguer%'
    OR name ILIKE '%hambúrguer%' THEN 'burger'
  WHEN name ILIKE '%refrigerante%'
    OR name ILIKE '%refri%' THEN 'drink'
  ELSE NULL
END;

CREATE FUNCTION canteen_private.sale_option_label(
  profile text,
  drink text,
  doneness text,
  removed jsonb
)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path = pg_catalog
AS $$
DECLARE
  v_drink text := nullif(btrim(drink), '');
  v_doneness text := nullif(btrim(doneness), '');
  v_removed text[] := ARRAY[]::text[];
  v_value text;
  v_allowed_removed text[] := ARRAY['Maionese', 'Alface', 'Tomate', 'Queijo'];
  v_ordered text[] := ARRAY[]::text[];
  v_drinks text[] := ARRAY['Coca', 'Coca Zero', 'Guaraná', 'Suco de laranja', 'Suco de uva'];
  v_doneness_values text[] := ARRAY['Mal passado', 'Ao ponto', 'Bem passado'];
  v_burger text;
BEGIN
  IF removed IS NULL OR jsonb_typeof(removed) = 'null' THEN
    removed := '[]'::jsonb;
  END IF;
  IF jsonb_typeof(removed) <> 'array' THEN
    RAISE EXCEPTION 'Removed items must be a list';
  END IF;

  FOR v_value IN
    SELECT jsonb_array_elements_text(removed)
  LOOP
    IF v_value <> ALL (v_allowed_removed) THEN
      RAISE EXCEPTION 'Unknown item option';
    END IF;
    IF v_value = ANY (v_removed) THEN
      RAISE EXCEPTION 'Duplicate removed item';
    END IF;
    v_removed := v_removed || v_value;
  END LOOP;

  IF profile IS NULL THEN
    IF v_drink IS NOT NULL OR v_doneness IS NOT NULL OR cardinality(v_removed) > 0 THEN
      RAISE EXCEPTION 'This item has no options';
    END IF;
    RETURN NULL;
  END IF;

  IF profile = 'drink' THEN
    IF v_doneness IS NOT NULL OR cardinality(v_removed) > 0 THEN
      RAISE EXCEPTION 'Unknown item option';
    END IF;
    IF v_drink IS NULL OR v_drink <> ALL (v_drinks) THEN
      RAISE EXCEPTION 'Choose the drink';
    END IF;
    RETURN v_drink;
  END IF;

  IF v_doneness IS NULL OR v_doneness <> ALL (v_doneness_values) THEN
    RAISE EXCEPTION 'Choose how the burger should be cooked';
  END IF;

  FOREACH v_value IN ARRAY v_allowed_removed
  LOOP
    IF v_value = ANY (v_removed) THEN
      v_ordered := v_ordered || v_value;
    END IF;
  END LOOP;

  v_burger := v_doneness;
  IF cardinality(v_ordered) > 0 THEN
    v_burger := v_burger || ' · sem ' || array_to_string(v_ordered, ', ');
  END IF;

  IF profile = 'burger' THEN
    IF v_drink IS NOT NULL THEN
      RAISE EXCEPTION 'Unknown item option';
    END IF;
    RETURN v_burger;
  END IF;

  IF profile = 'combo' THEN
    IF v_drink IS NULL OR v_drink <> ALL (v_drinks) THEN
      RAISE EXCEPTION 'Choose the drink';
    END IF;
    RETURN v_burger || E'\n' || v_drink;
  END IF;

  RAISE EXCEPTION 'Unknown item option';
END;
$$;

REVOKE ALL ON FUNCTION canteen_private.sale_option_label(text, text, text, jsonb) FROM PUBLIC;

CREATE OR REPLACE FUNCTION canteen.create_sale(store_slug text, lines jsonb)
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
BEGIN
  IF store_slug IS NULL OR lines IS NULL OR jsonb_typeof(lines) <> 'array' THEN
    RAISE EXCEPTION 'Store slug and a list of lines are required';
  END IF;

  v_line_count = jsonb_array_length(lines);
  IF v_line_count < 1 OR v_line_count > 40 THEN
    RAISE EXCEPTION 'A sale needs between 1 and 40 lines';
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
    total_items
  )
  VALUES (
    v_store.id,
    v_sale_id,
    'new',
    (
      SELECT COALESCE(sum(si.quantity), 0)::integer
      FROM canteen.sale_items si
      WHERE si.sale_id = v_sale_id
    )
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

CREATE OR REPLACE FUNCTION canteen.read_menu(store_slug text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
  v_store canteen.stores%ROWTYPE;
  v_categories jsonb;
  v_items jsonb;
BEGIN
  SELECT *
  INTO v_store
  FROM canteen.stores
  WHERE slug = store_slug
    AND is_active;

  IF v_store.id IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id', c.id,
        'name', c.name,
        'description', c.description
      )
      ORDER BY c.name
    ),
    '[]'::jsonb
  )
  INTO v_categories
  FROM canteen.categories c
  WHERE c.store_id = v_store.id;

  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id', m.id,
        'name', m.name,
        'description', m.description,
        'price', m.price,
        'stock', m.stock,
        'category_id', m.category_id,
        'image_url', m.image_url,
        'option_profile', m.option_profile
      )
      ORDER BY m.name
    ),
    '[]'::jsonb
  )
  INTO v_items
  FROM canteen.menu_items m
  WHERE m.store_id = v_store.id;

  RETURN jsonb_build_object(
    'store', jsonb_build_object(
      'id', v_store.id,
      'name', v_store.name,
      'slug', v_store.slug
    ),
    'categories', v_categories,
    'menu_items', v_items
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

GRANT EXECUTE ON FUNCTION canteen.read_menu(text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION canteen.create_sale(text, jsonb) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION canteen.list_kitchen_orders(text) TO anon, authenticated, service_role;
REVOKE ALL ON FUNCTION canteen_private.sale_option_label(text, text, text, jsonb) FROM PUBLIC, anon, authenticated;
