/**
 * These statements are the race-safety contract for V1.2.
 *
 * PostgreSQL serializes concurrent UPDATEs to the same row. Because reservation
 * acquisition is a single conditional UPDATE, only the transaction that still
 * observes AVAILABLE can receive a returned row. A second concurrent buyer gets
 * zero rows and must not create Checkout.
 */
export const RESERVE_ONE_OF_ONE_SQL = `
UPDATE commerce_relics
SET
  status = 'reserved',
  reservation_token = $2,
  reserved_until = $3,
  updated_at = now()
WHERE relic_id = $1
  AND status = 'available'
  AND quantity = 1
RETURNING *;
`.trim();

export const RELEASE_RESERVATION_SQL = `
UPDATE commerce_relics
SET
  status = 'available',
  reservation_token = NULL,
  reserved_until = NULL,
  updated_at = now()
WHERE relic_id = $1
  AND status = 'reserved'
  AND reservation_token = $2
RETURNING *;
`.trim();

export const RELEASE_EXPIRED_RESERVATIONS_SQL = `
UPDATE commerce_relics
SET
  status = 'available',
  reservation_token = NULL,
  reserved_until = NULL,
  updated_at = now()
WHERE status = 'reserved'
  AND reserved_until <= now()
RETURNING relic_id;
`.trim();

export const TRANSFER_RESERVED_RELIC_SQL = `
UPDATE commerce_relics
SET
  status = 'transferred',
  quantity = 0,
  reservation_token = NULL,
  reserved_until = NULL,
  transfer_date = $3,
  updated_at = now()
WHERE relic_id = $1
  AND status = 'reserved'
  AND reservation_token = $2
  AND quantity = 1
RETURNING *;
`.trim();

export const RECORD_STRIPE_EVENT_ONCE_SQL = `
INSERT INTO commerce_events (
  id,
  event_key,
  relic_id,
  order_id,
  event_type,
  source,
  stripe_event_id,
  reservation_token
)
VALUES ($1, $2, $3, $4, $5, 'stripe', $6, $7)
ON CONFLICT (event_key) DO NOTHING
RETURNING id;
`.trim();
