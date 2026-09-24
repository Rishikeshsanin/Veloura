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
