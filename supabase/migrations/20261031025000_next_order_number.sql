-- The counter shows the next ticket number before the sale is confirmed.

CREATE FUNCTION canteen.next_order_number(store_slug text)
RETURNS integer
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
  v_store_id uuid;
BEGIN
  v_store_id := canteen_private.active_store_id(store_slug);
  IF v_store_id IS NULL THEN
    RETURN NULL;
  END IF;

  RETURN (
    SELECT COALESCE(max(k.order_number), 0) + 1
    FROM canteen.kitchen_orders k
    WHERE k.store_id = v_store_id
  );
END;
$$;

REVOKE ALL ON FUNCTION canteen.next_order_number(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION canteen.next_order_number(text) TO anon, authenticated, service_role;
