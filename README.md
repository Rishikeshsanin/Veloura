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
- Project Hub App 14 with an isolated `veloura` schema, seven RLS-locked commerce tables, and no public policies

Payments remain sandbox-only. Orders created today are real Veloura browser records, not real charges or shipments. Server/database sync is intentionally gated behind the scoped-backend activation plan in `docs/V10_BACKEND.md`.

## V11 accounts and cloud sync

Veloura now supports real customer accounts using Supabase Auth and account-scoped RLS:

- email/password sign-in, sign-up and password reset
- cross-device bag, saved-for-later, wishlist and address sync
- synced style signals and recently viewed products
- synced sandbox order history
- guest state merges into the account at first sign-in
- local account caches are cleared on sign-out for shared-device privacy
- verified-purchase reviews require a delivered Veloura order for the exact product
- no service-role key, database password or private credential is shipped to the browser

Guest shopping and checkout remain available without an account.

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


## V12 final hardening

The final storefront hardening pass adds:

- synonym-aware and typo-tolerant ranked search
- search correction and zero-result recovery
- keyboard-navigable search and modal focus trapping
- live wishlist price/stock refresh with price-drop and back-in-stock signals
- route-aware canonical metadata, Open Graph/Twitter metadata, robots.txt and sitemap.xml
- factual Product + Breadcrumb JSON-LD without pretending sandbox checkout is live retail fulfilment
- authenticated, account-scoped commerce analytics events
- complete password-reset flow including setting a new password
- atomic authenticated order creation through `veloura.create_order_snapshot`
- immutable browser-side order item history after creation
- restricted order cancellation columns
- private reviewer/order linkage with `veloura.review_eligibility`
- verified-purchase review eligibility that cannot be forged by creating a fake delivered order in the browser

Payment and physical fulfilment remain intentionally sandboxed. Real card/UPI credentials are never stored by Veloura.


## V13 advanced UX and engineering polish

Phase 5 and Phase 6 are implemented without activating real payment or fulfilment:

- side-by-side comparison for up to four products
- recently viewed discovery across shopping routes
- fit advisor inside the size guide
- transparent sandbox pincode delivery windows
- factual product Q&A
- wishlist price-drop/back-in-stock detection
- opt-in browser notifications for real wishlist changes
- optional photos on verified buyer reviews using a Veloura-only storage bucket
- bounded provider concurrency for deeper catalog expansion
- signed-in frontend error telemetry
- Playwright desktop/mobile E2E tests
- axe critical-accessibility checks
- Lighthouse CI reports
- critical npm audit
- weekly CodeQL and Dependabot monitoring

See `docs/QUALITY.md` for the permanent release gates and limitations.
