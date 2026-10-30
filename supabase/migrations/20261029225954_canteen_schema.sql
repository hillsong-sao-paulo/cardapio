-- Canteen schema for hsp-sales (project ncbuyfshfomlttjytfqs).
-- This file is the migration to review. Applying it is a later step.
--
-- Anonymous clients get no table privileges. Public screens call the four
-- functions that take a store slug: read_menu, create_sale, list_kitchen_orders,
-- and update_kitchen_order. Each function uses only the active store for that slug.
--
-- A signed-in admin can read and change rows for their own campus only.
-- Campus membership is not self-serve: insert it with the service role after
-- the person exists in Supabase Auth. Signing up does not make someone an admin.
--
-- Seeded data is the two campuses only. No stores, menu, sales, or password hashes.

CREATE SCHEMA canteen;
CREATE SCHEMA canteen_private;

REVOKE ALL ON SCHEMA canteen FROM PUBLIC;
REVOKE ALL ON SCHEMA canteen_private FROM PUBLIC;

GRANT USAGE ON SCHEMA canteen TO anon, authenticated, service_role;
GRANT USAGE ON SCHEMA canteen_private TO authenticated, service_role, supabase_auth_admin;

COMMENT ON SCHEMA canteen IS
  'Canteen and event data. Public access is by store slug, through functions.';
COMMENT ON SCHEMA canteen_private IS
  'Helpers and triggers. Not listed in the API exposed schemas.';

-- Keep later objects in this schema off the Data API until a migration grants them.
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA canteen
  REVOKE ALL ON TABLES FROM PUBLIC, anon, authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA canteen
  REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA canteen_private
  REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;

CREATE TABLE canteen.campuses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE canteen.stores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campus_id uuid NOT NULL REFERENCES canteen.campuses (id) ON DELETE RESTRICT,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT stores_slug_format CHECK (
    slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'
    AND char_length(slug) BETWEEN 3 AND 63
  )
);

CREATE TABLE canteen.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES canteen.stores (id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT categories_store_name_unique UNIQUE (store_id, name)
);

CREATE TABLE canteen.menu_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES canteen.stores (id) ON DELETE CASCADE,
  category_id uuid REFERENCES canteen.categories (id) ON DELETE SET NULL,
  name text NOT NULL,
  description text,
  price numeric(10, 2) NOT NULL,
  stock integer NOT NULL DEFAULT 0,
  image_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT menu_items_price_nonnegative CHECK (price >= 0),
  CONSTRAINT menu_items_stock_nonnegative CHECK (stock >= 0)
);

CREATE TABLE canteen.sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES canteen.stores (id) ON DELETE RESTRICT,
  total numeric(10, 2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT sales_total_nonnegative CHECK (total >= 0)
);

CREATE TABLE canteen.sale_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id uuid NOT NULL REFERENCES canteen.sales (id) ON DELETE CASCADE,
  menu_item_id uuid NOT NULL REFERENCES canteen.menu_items (id) ON DELETE RESTRICT,
  quantity integer NOT NULL,
  unit_price numeric(10, 2) NOT NULL,
  subtotal numeric(10, 2) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT sale_items_quantity_positive CHECK (quantity > 0),
  CONSTRAINT sale_items_unit_price_nonnegative CHECK (unit_price >= 0),
  CONSTRAINT sale_items_subtotal_matches CHECK (
    subtotal = round(unit_price * quantity, 2)
  )
);

CREATE TABLE canteen.kitchen_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES canteen.stores (id) ON DELETE RESTRICT,
  sale_id uuid REFERENCES canteen.sales (id) ON DELETE CASCADE,
  order_number integer NOT NULL,
  status text NOT NULL DEFAULT 'new',
  created_at timestamptz NOT NULL DEFAULT now(),
  ready_at timestamptz,
  total_items integer NOT NULL DEFAULT 0,
  CONSTRAINT kitchen_orders_status_check CHECK (status IN ('new', 'ready')),
  CONSTRAINT kitchen_orders_number_positive CHECK (order_number > 0),
  CONSTRAINT kitchen_orders_total_items_nonnegative CHECK (total_items >= 0),
  CONSTRAINT kitchen_orders_store_number_unique UNIQUE (store_id, order_number)
);

CREATE TABLE canteen.kitchen_order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kitchen_order_id uuid NOT NULL REFERENCES canteen.kitchen_orders (id) ON DELETE CASCADE,
  menu_item_id uuid REFERENCES canteen.menu_items (id) ON DELETE SET NULL,
  menu_item_name text NOT NULL,
  quantity integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT kitchen_order_items_quantity_positive CHECK (quantity > 0)
);

CREATE TABLE canteen.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  email text,
  name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE canteen.campus_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES canteen.profiles (id) ON DELETE CASCADE,
  campus_id uuid NOT NULL REFERENCES canteen.campuses (id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT campus_memberships_profile_campus_unique UNIQUE (profile_id, campus_id)
);

COMMENT ON TABLE canteen.campuses IS 'Zona Sul and Zona Leste. Admins belong to a campus.';
COMMENT ON TABLE canteen.stores IS 'One canteen or event. The public link is the slug.';
COMMENT ON TABLE canteen.categories IS 'Menu groups for a single store.';
COMMENT ON TABLE canteen.menu_items IS 'Sellable items. Stock is for that store only.';
COMMENT ON TABLE canteen.sales IS 'A counter sale for one store.';
COMMENT ON TABLE canteen.sale_items IS 'Lines of a sale. Inserting a line decreases that store stock.';
COMMENT ON TABLE canteen.kitchen_orders IS 'Kitchen ticket for one store.';
COMMENT ON TABLE canteen.kitchen_order_items IS 'Snapshot of what the kitchen should prepare.';
COMMENT ON TABLE canteen.profiles IS 'App profile for a Supabase Auth user. No password hash.';
COMMENT ON TABLE canteen.campus_memberships IS
  'Which campuses an admin may manage. Rows are inserted with the service role.';

CREATE INDEX stores_campus_id_idx ON canteen.stores (campus_id);
CREATE INDEX categories_store_id_idx ON canteen.categories (store_id);
CREATE INDEX menu_items_store_id_idx ON canteen.menu_items (store_id);
CREATE INDEX menu_items_category_id_idx ON canteen.menu_items (category_id);
CREATE INDEX sales_store_id_created_at_idx ON canteen.sales (store_id, created_at DESC);
CREATE INDEX sale_items_sale_id_idx ON canteen.sale_items (sale_id);
CREATE INDEX sale_items_menu_item_id_idx ON canteen.sale_items (menu_item_id);
CREATE INDEX kitchen_orders_store_id_created_at_idx
  ON canteen.kitchen_orders (store_id, created_at DESC);
CREATE INDEX kitchen_orders_store_id_status_idx
  ON canteen.kitchen_orders (store_id, status);
CREATE INDEX kitchen_order_items_kitchen_order_id_idx
  ON canteen.kitchen_order_items (kitchen_order_id);
CREATE INDEX campus_memberships_profile_id_idx
  ON canteen.campus_memberships (profile_id);
CREATE INDEX campus_memberships_campus_id_idx
  ON canteen.campus_memberships (campus_id);
CREATE INDEX profiles_email_idx ON canteen.profiles (email);

CREATE FUNCTION canteen_private.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER campuses_set_updated_at
  BEFORE UPDATE ON canteen.campuses
  FOR EACH ROW
  EXECUTE FUNCTION canteen_private.set_updated_at();

CREATE TRIGGER stores_set_updated_at
  BEFORE UPDATE ON canteen.stores
  FOR EACH ROW
  EXECUTE FUNCTION canteen_private.set_updated_at();

CREATE TRIGGER categories_set_updated_at
  BEFORE UPDATE ON canteen.categories
  FOR EACH ROW
  EXECUTE FUNCTION canteen_private.set_updated_at();

CREATE TRIGGER menu_items_set_updated_at
  BEFORE UPDATE ON canteen.menu_items
  FOR EACH ROW
  EXECUTE FUNCTION canteen_private.set_updated_at();

CREATE TRIGGER profiles_set_updated_at
  BEFORE UPDATE ON canteen.profiles
  FOR EACH ROW
  EXECUTE FUNCTION canteen_private.set_updated_at();

CREATE FUNCTION canteen_private.enforce_menu_item_store()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog
AS $$
DECLARE
  v_category_store uuid;
BEGIN
  IF NEW.category_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT c.store_id
  INTO v_category_store
  FROM canteen.categories c
  WHERE c.id = NEW.category_id;

  IF v_category_store IS DISTINCT FROM NEW.store_id THEN
    RAISE EXCEPTION 'Menu item category must belong to the same store';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER menu_items_enforce_store
  BEFORE INSERT OR UPDATE ON canteen.menu_items
  FOR EACH ROW
  EXECUTE FUNCTION canteen_private.enforce_menu_item_store();

-- Runs as the caller. The public sale function is security definer, so this
-- still sees the row. An admin insert is checked against that admin's RLS.
CREATE FUNCTION canteen_private.apply_sale_item()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog
AS $$
DECLARE
  v_item canteen.menu_items%ROWTYPE;
  v_sale_store uuid;
BEGIN
  SELECT s.store_id
  INTO v_sale_store
  FROM canteen.sales s
  WHERE s.id = NEW.sale_id;

  IF v_sale_store IS NULL THEN
    RAISE EXCEPTION 'Sale not found';
  END IF;

  SELECT *
  INTO v_item
  FROM canteen.menu_items
  WHERE id = NEW.menu_item_id
  FOR UPDATE;

  IF v_item.id IS NULL OR v_item.store_id IS DISTINCT FROM v_sale_store THEN
    RAISE EXCEPTION 'Menu item does not belong to this store';
  END IF;

  IF v_item.stock < NEW.quantity THEN
    RAISE EXCEPTION 'Not enough stock';
  END IF;

  NEW.unit_price = v_item.price;
  NEW.subtotal = round(v_item.price * NEW.quantity, 2);

  UPDATE canteen.menu_items
  SET stock = stock - NEW.quantity
  WHERE id = v_item.id;

  RETURN NEW;
END;
$$;

CREATE TRIGGER sale_items_apply_stock
  BEFORE INSERT ON canteen.sale_items
  FOR EACH ROW
  EXECUTE FUNCTION canteen_private.apply_sale_item();

CREATE FUNCTION canteen_private.refresh_sale_total()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog
AS $$
BEGIN
  UPDATE canteen.sales
  SET total = COALESCE((
    SELECT round(sum(si.subtotal), 2)
    FROM canteen.sale_items si
    WHERE si.sale_id = NEW.sale_id
  ), 0)
  WHERE id = NEW.sale_id;

  RETURN NULL;
END;
$$;

CREATE TRIGGER sale_items_refresh_total
  AFTER INSERT ON canteen.sale_items
  FOR EACH ROW
  EXECUTE FUNCTION canteen_private.refresh_sale_total();

CREATE FUNCTION canteen_private.prepare_kitchen_order()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog
AS $$
DECLARE
  v_sale_store uuid;
BEGIN
  IF NEW.sale_id IS NOT NULL THEN
    SELECT s.store_id
    INTO v_sale_store
    FROM canteen.sales s
    WHERE s.id = NEW.sale_id;

    IF v_sale_store IS DISTINCT FROM NEW.store_id THEN
      RAISE EXCEPTION 'Sale belongs to a different store';
    END IF;
  END IF;

  -- One lock per store keeps order numbers unique under two cashiers.
  PERFORM 1
  FROM canteen.stores
  WHERE id = NEW.store_id
  FOR UPDATE;

  SELECT COALESCE(max(k.order_number), 0) + 1
  INTO NEW.order_number
  FROM canteen.kitchen_orders k
  WHERE k.store_id = NEW.store_id;

  RETURN NEW;
END;
$$;

CREATE TRIGGER kitchen_orders_prepare
  BEFORE INSERT ON canteen.kitchen_orders
  FOR EACH ROW
  EXECUTE FUNCTION canteen_private.prepare_kitchen_order();

CREATE FUNCTION canteen_private.set_kitchen_ready_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog
AS $$
BEGIN
  IF NEW.status = 'ready' AND OLD.status IS DISTINCT FROM 'ready' THEN
    NEW.ready_at = now();
  ELSIF NEW.status = 'new' THEN
    NEW.ready_at = NULL;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER kitchen_orders_set_ready_at
  BEFORE UPDATE ON canteen.kitchen_orders
  FOR EACH ROW
  EXECUTE FUNCTION canteen_private.set_kitchen_ready_at();

-- Display name only. Authorization uses campus_memberships, never this metadata.
CREATE FUNCTION canteen_private.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
BEGIN
  INSERT INTO canteen.profiles (id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    NULLIF(NEW.raw_user_meta_data ->> 'name', '')
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION canteen_private.handle_new_user();

CREATE FUNCTION canteen_private.active_store_id(store_slug text)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
  SELECT s.id
  FROM canteen.stores s
  WHERE s.slug = store_slug
    AND s.is_active;
$$;

CREATE FUNCTION canteen_private.current_admin_campus_ids()
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = pg_catalog
AS $$
  SELECT m.campus_id
  FROM canteen.campus_memberships m
  WHERE m.profile_id = (SELECT auth.uid());
$$;

CREATE FUNCTION canteen.read_menu(store_slug text)
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
        'image_url', m.image_url
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

CREATE FUNCTION canteen.create_sale(store_slug text, lines jsonb)
RETURNS jsonb
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
  v_store canteen.stores%ROWTYPE;
  v_sale_id uuid;
  v_line jsonb;
  v_item_id uuid;
  v_quantity integer;
  v_seen uuid[] := ARRAY[]::uuid[];
  v_line_count integer;
  v_kitchen_id uuid;
  v_order_number integer;
  v_total numeric(10, 2);
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

    IF v_item_id = ANY (v_seen) THEN
      RAISE EXCEPTION 'Duplicate menu item in the same sale';
    END IF;
    v_seen = v_seen || v_item_id;

    INSERT INTO canteen.sale_items (
      sale_id,
      menu_item_id,
      quantity,
      unit_price,
      subtotal
    )
    VALUES (v_sale_id, v_item_id, v_quantity, 0, 0);
  END LOOP;

  -- order_number is assigned by the before-insert trigger, per store.
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
    quantity
  )
  SELECT
    v_kitchen_id,
    si.menu_item_id,
    mi.name,
    si.quantity
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

CREATE FUNCTION canteen.list_kitchen_orders(store_slug text)
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
              'quantity', i.quantity
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

CREATE FUNCTION canteen.update_kitchen_order(
  store_slug text,
  order_id uuid,
  next_status text
)
RETURNS jsonb
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
  v_store_id uuid;
  v_order canteen.kitchen_orders%ROWTYPE;
BEGIN
  IF next_status NOT IN ('new', 'ready') THEN
    RAISE EXCEPTION 'Status must be new or ready';
  END IF;

  v_store_id = canteen_private.active_store_id(store_slug);
  IF v_store_id IS NULL THEN
    RAISE EXCEPTION 'Store not found';
  END IF;

  UPDATE canteen.kitchen_orders
  SET status = next_status
  WHERE id = order_id
    AND store_id = v_store_id
  RETURNING * INTO v_order;

  IF v_order.id IS NULL THEN
    RAISE EXCEPTION 'Order not found';
  END IF;

  RETURN jsonb_build_object(
    'id', v_order.id,
    'order_number', v_order.order_number,
    'status', v_order.status,
    'created_at', v_order.created_at,
    'ready_at', v_order.ready_at,
    'total_items', v_order.total_items
  );
END;
$$;

COMMENT ON FUNCTION canteen.read_menu(text) IS
  'Menu for one active store. Returns null when the slug is unknown or the store is off.';
COMMENT ON FUNCTION canteen.create_sale(text, jsonb) IS
  'Creates a sale for one active store, decreases that store stock, and opens a kitchen ticket.';
COMMENT ON FUNCTION canteen.list_kitchen_orders(text) IS
  'Open kitchen tickets for one store, plus ready tickets from the last 36 hours, capped at 200.';
COMMENT ON FUNCTION canteen.update_kitchen_order(text, uuid, text) IS
  'Sets one kitchen ticket to new or ready when it belongs to the slug store.';

REVOKE ALL ON FUNCTION canteen_private.set_updated_at() FROM PUBLIC;
REVOKE ALL ON FUNCTION canteen_private.enforce_menu_item_store() FROM PUBLIC;
REVOKE ALL ON FUNCTION canteen_private.apply_sale_item() FROM PUBLIC;
REVOKE ALL ON FUNCTION canteen_private.refresh_sale_total() FROM PUBLIC;
REVOKE ALL ON FUNCTION canteen_private.prepare_kitchen_order() FROM PUBLIC;
REVOKE ALL ON FUNCTION canteen_private.set_kitchen_ready_at() FROM PUBLIC;
REVOKE ALL ON FUNCTION canteen_private.handle_new_user() FROM PUBLIC;
REVOKE ALL ON FUNCTION canteen_private.active_store_id(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION canteen_private.current_admin_campus_ids() FROM PUBLIC;
REVOKE ALL ON FUNCTION canteen.read_menu(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION canteen.create_sale(text, jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION canteen.list_kitchen_orders(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION canteen.update_kitchen_order(text, uuid, text) FROM PUBLIC;

-- Trigger functions are not on the API. Callers who insert rows still need EXECUTE.
GRANT EXECUTE ON FUNCTION canteen_private.set_updated_at() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION canteen_private.enforce_menu_item_store() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION canteen_private.apply_sale_item() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION canteen_private.refresh_sale_total() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION canteen_private.prepare_kitchen_order() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION canteen_private.set_kitchen_ready_at() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION canteen_private.handle_new_user() TO supabase_auth_admin, service_role;
GRANT EXECUTE ON FUNCTION canteen_private.current_admin_campus_ids() TO authenticated, service_role;

GRANT EXECUTE ON FUNCTION canteen.read_menu(text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION canteen.create_sale(text, jsonb) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION canteen.list_kitchen_orders(text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION canteen.update_kitchen_order(text, uuid, text)
  TO anon, authenticated, service_role;

ALTER TABLE canteen.campuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE canteen.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE canteen.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE canteen.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE canteen.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE canteen.sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE canteen.kitchen_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE canteen.kitchen_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE canteen.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE canteen.campus_memberships ENABLE ROW LEVEL SECURITY;

-- No policies for anon. Combined with the grants below, anonymous clients
-- cannot select a whole table. They use the slug functions.

CREATE POLICY campuses_admin_select
  ON canteen.campuses
  FOR SELECT
  TO authenticated
  USING (id IN (SELECT canteen_private.current_admin_campus_ids()));

CREATE POLICY stores_admin_select
  ON canteen.stores
  FOR SELECT
  TO authenticated
  USING (campus_id IN (SELECT canteen_private.current_admin_campus_ids()));

CREATE POLICY stores_admin_insert
  ON canteen.stores
  FOR INSERT
  TO authenticated
  WITH CHECK (campus_id IN (SELECT canteen_private.current_admin_campus_ids()));

CREATE POLICY stores_admin_update
  ON canteen.stores
  FOR UPDATE
  TO authenticated
  USING (campus_id IN (SELECT canteen_private.current_admin_campus_ids()))
  WITH CHECK (campus_id IN (SELECT canteen_private.current_admin_campus_ids()));

CREATE POLICY stores_admin_delete
  ON canteen.stores
  FOR DELETE
  TO authenticated
  USING (campus_id IN (SELECT canteen_private.current_admin_campus_ids()));

CREATE POLICY categories_admin_select
  ON canteen.categories
  FOR SELECT
  TO authenticated
  USING (
    store_id IN (
      SELECT s.id
      FROM canteen.stores s
      WHERE s.campus_id IN (SELECT canteen_private.current_admin_campus_ids())
    )
  );

CREATE POLICY categories_admin_insert
  ON canteen.categories
  FOR INSERT
  TO authenticated
  WITH CHECK (
    store_id IN (
      SELECT s.id
      FROM canteen.stores s
      WHERE s.campus_id IN (SELECT canteen_private.current_admin_campus_ids())
    )
  );

CREATE POLICY categories_admin_update
  ON canteen.categories
  FOR UPDATE
  TO authenticated
  USING (
    store_id IN (
      SELECT s.id
      FROM canteen.stores s
      WHERE s.campus_id IN (SELECT canteen_private.current_admin_campus_ids())
    )
  )
  WITH CHECK (
    store_id IN (
      SELECT s.id
      FROM canteen.stores s
      WHERE s.campus_id IN (SELECT canteen_private.current_admin_campus_ids())
    )
  );

CREATE POLICY categories_admin_delete
  ON canteen.categories
  FOR DELETE
  TO authenticated
  USING (
    store_id IN (
      SELECT s.id
      FROM canteen.stores s
      WHERE s.campus_id IN (SELECT canteen_private.current_admin_campus_ids())
    )
  );

CREATE POLICY menu_items_admin_select
  ON canteen.menu_items
  FOR SELECT
  TO authenticated
  USING (
    store_id IN (
      SELECT s.id
      FROM canteen.stores s
      WHERE s.campus_id IN (SELECT canteen_private.current_admin_campus_ids())
    )
  );

CREATE POLICY menu_items_admin_insert
  ON canteen.menu_items
  FOR INSERT
  TO authenticated
  WITH CHECK (
    store_id IN (
      SELECT s.id
      FROM canteen.stores s
      WHERE s.campus_id IN (SELECT canteen_private.current_admin_campus_ids())
    )
  );

CREATE POLICY menu_items_admin_update
  ON canteen.menu_items
  FOR UPDATE
  TO authenticated
  USING (
    store_id IN (
      SELECT s.id
      FROM canteen.stores s
      WHERE s.campus_id IN (SELECT canteen_private.current_admin_campus_ids())
    )
  )
  WITH CHECK (
    store_id IN (
      SELECT s.id
      FROM canteen.stores s
      WHERE s.campus_id IN (SELECT canteen_private.current_admin_campus_ids())
    )
  );

CREATE POLICY menu_items_admin_delete
  ON canteen.menu_items
  FOR DELETE
  TO authenticated
  USING (
    store_id IN (
      SELECT s.id
      FROM canteen.stores s
      WHERE s.campus_id IN (SELECT canteen_private.current_admin_campus_ids())
    )
  );

CREATE POLICY sales_admin_select
  ON canteen.sales
  FOR SELECT
  TO authenticated
  USING (
    store_id IN (
      SELECT s.id
      FROM canteen.stores s
      WHERE s.campus_id IN (SELECT canteen_private.current_admin_campus_ids())
    )
  );

CREATE POLICY sales_admin_insert
  ON canteen.sales
  FOR INSERT
  TO authenticated
  WITH CHECK (
    store_id IN (
      SELECT s.id
      FROM canteen.stores s
      WHERE s.campus_id IN (SELECT canteen_private.current_admin_campus_ids())
    )
  );

CREATE POLICY sales_admin_update
  ON canteen.sales
  FOR UPDATE
  TO authenticated
  USING (
    store_id IN (
      SELECT s.id
      FROM canteen.stores s
      WHERE s.campus_id IN (SELECT canteen_private.current_admin_campus_ids())
    )
  )
  WITH CHECK (
    store_id IN (
      SELECT s.id
      FROM canteen.stores s
      WHERE s.campus_id IN (SELECT canteen_private.current_admin_campus_ids())
    )
  );

CREATE POLICY sales_admin_delete
  ON canteen.sales
  FOR DELETE
  TO authenticated
  USING (
    store_id IN (
      SELECT s.id
      FROM canteen.stores s
      WHERE s.campus_id IN (SELECT canteen_private.current_admin_campus_ids())
    )
  );

CREATE POLICY sale_items_admin_select
  ON canteen.sale_items
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM canteen.sales s
      WHERE s.id = sale_id
    )
  );

CREATE POLICY sale_items_admin_insert
  ON canteen.sale_items
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM canteen.sales s
      WHERE s.id = sale_id
    )
  );

CREATE POLICY kitchen_orders_admin_select
  ON canteen.kitchen_orders
  FOR SELECT
  TO authenticated
  USING (
    store_id IN (
      SELECT s.id
      FROM canteen.stores s
      WHERE s.campus_id IN (SELECT canteen_private.current_admin_campus_ids())
    )
  );

CREATE POLICY kitchen_orders_admin_insert
  ON canteen.kitchen_orders
  FOR INSERT
  TO authenticated
  WITH CHECK (
    store_id IN (
      SELECT s.id
      FROM canteen.stores s
      WHERE s.campus_id IN (SELECT canteen_private.current_admin_campus_ids())
    )
  );

CREATE POLICY kitchen_orders_admin_update
  ON canteen.kitchen_orders
  FOR UPDATE
  TO authenticated
  USING (
    store_id IN (
      SELECT s.id
      FROM canteen.stores s
      WHERE s.campus_id IN (SELECT canteen_private.current_admin_campus_ids())
    )
  )
  WITH CHECK (
    store_id IN (
      SELECT s.id
      FROM canteen.stores s
      WHERE s.campus_id IN (SELECT canteen_private.current_admin_campus_ids())
    )
  );

CREATE POLICY kitchen_orders_admin_delete
  ON canteen.kitchen_orders
  FOR DELETE
  TO authenticated
  USING (
    store_id IN (
      SELECT s.id
      FROM canteen.stores s
      WHERE s.campus_id IN (SELECT canteen_private.current_admin_campus_ids())
    )
  );

CREATE POLICY kitchen_order_items_admin_select
  ON canteen.kitchen_order_items
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM canteen.kitchen_orders k
      WHERE k.id = kitchen_order_id
    )
  );

CREATE POLICY kitchen_order_items_admin_insert
  ON canteen.kitchen_order_items
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM canteen.kitchen_orders k
      WHERE k.id = kitchen_order_id
    )
  );

CREATE POLICY profiles_select_own
  ON canteen.profiles
  FOR SELECT
  TO authenticated
  USING (id = (SELECT auth.uid()));

CREATE POLICY profiles_update_own
  ON canteen.profiles
  FOR UPDATE
  TO authenticated
  USING (id = (SELECT auth.uid()))
  WITH CHECK (id = (SELECT auth.uid()));

CREATE POLICY campus_memberships_select_own
  ON canteen.campus_memberships
  FOR SELECT
  TO authenticated
  USING (profile_id = (SELECT auth.uid()));

REVOKE ALL ON ALL TABLES IN SCHEMA canteen FROM PUBLIC, anon;

GRANT SELECT ON TABLE canteen.campuses TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE canteen.stores TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE canteen.categories TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE canteen.menu_items TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE canteen.sales TO authenticated;
GRANT SELECT, INSERT ON TABLE canteen.sale_items TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE canteen.kitchen_orders TO authenticated;
GRANT SELECT, INSERT ON TABLE canteen.kitchen_order_items TO authenticated;
GRANT SELECT, UPDATE ON TABLE canteen.profiles TO authenticated;
GRANT SELECT ON TABLE canteen.campus_memberships TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA canteen TO service_role;

INSERT INTO canteen.campuses (name)
VALUES
  ('Zona Sul'),
  ('Zona Leste');
