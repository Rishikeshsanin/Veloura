# V10 Backend Activation Plan

Veloura V10 introduces a persistent commerce domain in the frontend and a backend-ready isolated schema.

## Current live behavior
- Bag, wishlist, recently viewed and style preferences keep their existing localStorage keys.
- Orders, addresses, coupons and Save for Later use new versioned Veloura keys.
- Checkout creates stable order records that survive refreshes.
- Orders can be viewed and tracked on the same device.
- Payment remains sandbox-only; no card/UPI request is sent.

## Supabase target
Shared Project Hub may be used only through a dedicated `veloura` schema.

Planned server-side objects:
- `veloura.profiles`
- `veloura.addresses`
- `veloura.orders`
- `veloura.order_items`
- `veloura.cart_items`
- `veloura.wishlist_items`
- `veloura.commerce_events`

The migration intentionally enables RLS without public policies. A future server runtime must use a dedicated scoped database role. The shared service-role key is not an application credential.

## Activation sequence
1. Verify V10 branch and preview build.
2. Register Veloura in Project Hub.
3. Apply the isolated schema migration.
4. Create a dedicated backend role and grants only for `veloura`.
5. Add server-side order/account APIs.
6. Store the dedicated database credential only in Vercel server environment variables.
7. Add auth sync without changing project-wide OAuth settings.
8. Verify RLS/security and production fallbacks.

Until steps 2–8 are complete, the storefront remains fully functional in local-first mode.
