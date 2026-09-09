# Remy Relics web

Mobile-first archive experience for Remy Relics. V1 remains the rollback-safe production baseline while V1.2 Commerce is developed only on `feat/commerce-v1-2`.

## Source authority

1. Figma `V1WXFOR0Gob6lBc14cbmba` owns visitor-facing visual and interaction truth.
2. Notion `Remy Relics · V1.2 Commerce Engineering Specification · 2026-09-08` owns commerce lifecycle, security, data, testing, and rollout.
3. GitHub owns executable implementation.
4. Vercel Preview owns runtime evidence.
5. Stripe plus the relational database own payment and inventory truth.

Production baseline: `main@dc74291cf5b4c86650ec89ffa6ec0a23e4471c19`.

## Architecture

- Next.js 16 App Router + TypeScript
- CSS Modules plus global Figma-derived design tokens
- code-backed archive/story presentation data separated from server-backed commerce truth
- Vitest for pure commerce/data contracts
- Playwright for route, interaction, responsive, and visual regression coverage

## V1.2 commerce state machine

V1.2 uses one server inventory state for one-of-one relics:

```text
AVAILABLE
  -> RESERVED
      -> AVAILABLE     canceled / failed / expired
      -> TRANSFERRED   verified successful payment
```

`RESERVED` is the inventory lock while a Stripe Checkout Session is active. Checkout creation must acquire the reservation first. A browser redirect never transfers inventory.

### Collision safety

Reservation acquisition is one conditional PostgreSQL `UPDATE ... WHERE status = 'available' AND quantity = 1 RETURNING *`. Concurrent updates to one row serialize in Postgres, so only the transaction that still observes `available` receives a row. Zero rows means checkout must be rejected as unavailable.

A successful payment may transfer only the row whose active `reservation_token` matches the checkout/order being reconciled.

### Idempotency

Stripe event processing is keyed by a unique `commerce_events.event_key` / `stripe_event_id`. Event insertion uses `ON CONFLICT DO NOTHING`. Order identity is independently protected by unique `stripe_checkout_session_id` and `stripe_payment_intent_id`.

Pass 03 must execute event claim, order persistence, and the conditional transfer in one database transaction. Duplicate delivery must become a no-op. A refund changes payment/fulfillment truth only; it never automatically performs `TRANSFERRED -> AVAILABLE`.

### Reservation release

Canceled, failed, or expired checkout releases only the row with the matching reservation token. Expired reservations are explicitly releasable by `reserved_until`; no client may release another checkout's reservation.

## Database

Schema authority for the branch is `db/migrations/001_commerce_v1_2.sql`. It defines:

- `commerce_relics`
- `commerce_orders`
- `commerce_events`
- unique permanent relic identity and Stripe transaction references
- one-of-one quantity/lifecycle consistency constraints
- reservation expiry indexing

No V1.2 migration has been applied to Production.

## Commands

```bash
npm run dev
npm run lint
npm run typecheck
npm run test
npm run build
npm run test:e2e
npm run test:visual
```

Set `NEXT_PUBLIC_SITE_URL` to the relevant deployment origin. Commerce secrets are server-only and must be supplied by the isolated Vercel environment; never commit them.
