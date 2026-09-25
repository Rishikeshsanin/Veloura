# V10 Backend Activation Plan

Veloura V10 introduces a persistent commerce domain in the frontend and a backend-ready isolated schema.

## Current live behavior
- Bag, wishlist, recently viewed and style preferences keep their existing localStorage keys.
- Orders, addresses, coupons and Save for Later use new versioned Veloura keys.
- Checkout creates stable order records that survive refreshes.
- Orders can be viewed and tracked on the same device.
- Payment remains sandbox-only; no card/UPI request is sent.

## Supabase foundation
Veloura is registered as **Project Hub App 14** with the dedicated schema `veloura`.

Provisioned server-side objects:
- `veloura.profiles`
- `veloura.addresses`
- `veloura.orders`
- `veloura.order_items`
- `veloura.cart_items`
- `veloura.wishlist_items`
- `veloura.commerce_events`

The schema is provisioned and every user-facing table has RLS enabled. There are intentionally no public/anon policies, so the browser cannot access these records yet. A future server runtime must use a dedicated scoped database role. The shared service-role key is not an application credential.

## Activation status
Completed:
1. Repository safety contract.
2. Project Hub App 14 registration.
3. Isolated `veloura` schema migration.
4. Hub resource/schema-version registration.
5. RLS verification on all seven tables.

Still intentionally gated:
1. Create a dedicated `veloura_backend` login role and scoped grants.
2. Store that credential in a supported Vercel server environment secret.
3. Add server-side account/order sync APIs.
4. Add auth sync without changing project-wide OAuth settings.
5. Verify server-side ownership checks and production fallbacks.

Until those gated steps are complete, the storefront remains fully functional in local-first mode.

## Release gate
Every V10 merge must pass the repository TypeScript + Vite production build workflow before `main` is advanced.


## V11 account sync activation

Completed:
- Supabase email/password authentication using the public publishable key
- authenticated RLS policies for profiles, addresses, cart, wishlist, orders, order items and commerce events
- guest-to-account merge instead of destructive replacement
- cross-device sync for bag, saved-for-later items, wishlist, addresses, style signals, recent browsing and sandbox order history
- sign-out privacy cleanup on shared devices
- verified-purchase review table and UI; insertion requires a delivered Veloura order containing the exact product
- sanitized public review reads only; user IDs are not granted to anonymous readers
- Data API exposure preserves the previously active schemas and adds only `veloura`

The shared Project Hub service-role key is still not used by Veloura. The browser uses only the Supabase publishable key plus the signed-in user's JWT, and PostgreSQL RLS is the ownership boundary.

### Data API exposure audit
Before adding Veloura, PostgREST reported 35 cached relations. The existing client-enabled schemas accounted for exactly those 35 relations:
- `ai_research_os`: 15
- `closeby`: 6
- `commercialiq`: 7
- `koshora`: 7

The manual PostgREST schema list therefore preserves:
`public, graphql_public, ai_research_os, closeby, commercialiq, koshora`
and adds only `veloura`.


## V12 integrity boundary

Veloura no longer grants authenticated browser clients direct order/order-item INSERT privileges.

`veloura.create_order_snapshot(...)` creates the order and its item snapshots atomically under the current `auth.uid()`, forces status=`placed` and payment_status=`sandbox`, validates totals, and rejects anonymous callers.

After creation:
- authenticated users may read only their own order rows/items through RLS
- authenticated users can update only `status` and `updated_at` on their own cancellable order
- RLS permits the client transition only to `cancelled`
- browser clients cannot alter total, address, product snapshots or add order items later

Review identity/order linkage columns are not granted for general authenticated reads. The authenticated-only `review_eligibility(product_id)` RPC returns an eligible delivered order item for the current user. Review INSERT is still independently protected by RLS.

Supabase Security Advisor was re-run after this migration and reported no findings belonging to the `veloura` schema.
