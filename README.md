# Veloura Women

A large, women-only fashion marketplace experience built with React, TypeScript and Vite.

## V3 catalog architecture

Veloura no longer renders one public API directly. The storefront now talks to a small catalog broker in `src/lib/catalog/`.

The broker currently combines:

- DummyJSON — women’s dresses, bags, footwear, jewellery, tops, beauty and skin care
- Fake Store API — women’s clothing and jewellery
- Platzi Fake Store API — additional women-relevant fashion inventory after gender/category filtering
- Makeup API — lipstick, mascara, blush, foundation, eyebrow and nail products
- Veloura curated reserve — a unique-image local fallback for reliability

The manager handles provider timeouts, schema normalization, women-only filtering, provider IDs, session caching, category balancing, quality scoring, product-title dedupe, **primary-image dedupe**, invalid image rejection and graceful provider failure. A dead API therefore does not take the shop down, and two different cards cannot intentionally leave the broker with the same primary image URL.

`getCatalogDiagnostics()` exposes provider health information for debugging and future admin tooling.

## V10 commerce foundation

Veloura now has a durable local-first commerce layer in addition to the catalog broker:

- stable order IDs and persistent order history
- saved delivery addresses and default-address selection
- order detail / tracking routes with explicit recorded vs expected milestones
- safe cancellation for newly placed orders
- Save for Later inside the shopping bag
- first-order and threshold coupon validation
- free-delivery progress and checkout totals from one shared commerce model
- backward-compatible cart, wishlist, recent-view and personalization storage
- an isolated `veloura` Supabase migration and repository safety contract ready for server activation

Payments remain sandbox-only. Orders created today are real Veloura browser records, not real charges or shipments. Server/database sync is intentionally gated behind the isolated Project Hub activation plan in `docs/V10_BACKEND.md`.

## Store experience

- Women-only search and navigation
- Dresses, tops, co-ords, ethnic wear, footwear, handbags, jewellery, beauty, activewear and winterwear
- INR pricing and Indian marketplace offer language
- High-density homepage merchandising
- Trending, deals, top brands, occasion and budget rails
- Dense multi-column catalog with search, filtering and sorting
- Product galleries, sizes, quantity selection and delivery UI
- Persistent wishlist and bag using localStorage
- UPI, card and COD sandbox checkout with persistent order records
- Responsive desktop, tablet and mobile layout
- Broken-image failover on listing cards and product pages
- Category-aware image fitting so product photography is not unnecessarily cropped

## Run locally

```bash
npm install
npm run dev
```

Production build:

```bash
npm run build
```

## Safety

- Card/UPI fields are sandbox-only and are never stored.
- Existing cart/wishlist/local personalization keys remain backward compatible.
- The current live commerce layer works locally without database availability.
- No existing Project Hub schema may be modified for Veloura.
- Backend activation is restricted to the dedicated `veloura` schema and a scoped server credential; the shared service-role key must never be used by the storefront.
