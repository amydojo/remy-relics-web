BEGIN;

CREATE TABLE commerce_relics (
  id text PRIMARY KEY,
  relic_id text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  price_cents integer NOT NULL CHECK (price_cents >= 0),
  currency char(3) NOT NULL DEFAULT 'USD' CHECK (currency = 'USD'),
  status text NOT NULL DEFAULT 'available'
    CHECK (status IN ('available', 'reserved', 'transferred', 'unavailable')),
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity IN (0, 1)),
  stripe_product_id text,
  stripe_price_id text,
  etsy_url text,
  reservation_token text UNIQUE,
  reserved_until timestamptz,
  transfer_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT commerce_relic_lifecycle_consistency CHECK (
    (status = 'available' AND quantity = 1 AND reservation_token IS NULL AND reserved_until IS NULL)
    OR
    (status = 'reserved' AND quantity = 1 AND reservation_token IS NOT NULL AND reserved_until IS NOT NULL)
    OR
    (status = 'transferred' AND quantity = 0 AND reservation_token IS NULL AND reserved_until IS NULL)
    OR
    (status = 'unavailable' AND quantity = 0 AND reservation_token IS NULL AND reserved_until IS NULL)
  )
);

CREATE INDEX commerce_relic_reservation_expiry_idx
  ON commerce_relics (reserved_until)
  WHERE status = 'reserved';

CREATE TABLE commerce_orders (
  id text PRIMARY KEY,
  stripe_checkout_session_id text UNIQUE,
  stripe_payment_intent_id text UNIQUE,
  relic_id text NOT NULL REFERENCES commerce_relics(relic_id),
  reservation_token text NOT NULL UNIQUE,
  checkout_expires_at timestamptz NOT NULL,
  amount_cents integer NOT NULL CHECK (amount_cents >= 0),
  currency char(3) NOT NULL DEFAULT 'USD' CHECK (currency = 'USD'),
  customer_email text,
  payment_status text NOT NULL
    CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded', 'canceled')),
  fulfillment_status text NOT NULL DEFAULT 'unfulfilled'
    CHECK (fulfillment_status IN ('unfulfilled', 'fulfilled', 'refunded', 'canceled')),
  shipping_name text,
  shipping_address jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE commerce_events (
  id text PRIMARY KEY,
  event_key text NOT NULL UNIQUE,
  relic_id text NOT NULL REFERENCES commerce_relics(relic_id),
  order_id text REFERENCES commerce_orders(id),
  event_type text NOT NULL
    CHECK (
      event_type IN (
        'reservation_started',
        'reservation_released',
        'checkout_created',
        'checkout_expired',
        'payment_succeeded',
        'payment_failed',
        'transfer_recorded',
        'refund_recorded'
      )
    ),
  source text NOT NULL CHECK (source IN ('stripe', 'system', 'operator')),
  stripe_event_id text UNIQUE,
  reservation_token text,
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMIT;
