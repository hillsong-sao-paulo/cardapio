-- Recent counter receipts: number, name and total. The public orders board does not use this.

CREATE FUNCTION canteen.list_recent_receipts(store_slug text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
  v_store_id uuid;
  v_receipts jsonb;
BEGIN
  v_store_id := canteen_private.active_store_id(store_slug);
  IF v_store_id IS NULL THEN
    RAISE EXCEPTION 'Store not found';
  END IF;

  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'order_number', recent.order_number,
        'customer_name', recent.customer_name,
        'total', recent.total,
        'created_at', recent.created_at
      )
      ORDER BY recent.order_number DESC
    ),
    '[]'::jsonb
  )
  INTO v_receipts
  FROM (
    SELECT k.order_number, k.customer_name, s.total, k.created_at
    FROM canteen.kitchen_orders k
    JOIN canteen.sales s ON s.id = k.sale_id
    WHERE k.store_id = v_store_id
    ORDER BY k.order_number DESC
    LIMIT 30
  ) recent;

  RETURN jsonb_build_object('receipts', v_receipts);
END;
$$;

REVOKE ALL ON FUNCTION canteen.list_recent_receipts(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION canteen.list_recent_receipts(text) TO anon, authenticated, service_role;
