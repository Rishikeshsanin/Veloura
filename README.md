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

## Store experience

- Women-only search and navigation
- Dresses, tops, co-ords, ethnic wear, footwear, handbags, jewellery, beauty, activewear and winterwear
- INR pricing and Indian marketplace offer language
- High-density homepage merchandising
- Trending, deals, top brands, occasion and budget rails
- Dense multi-column catalog with search, filtering and sorting
- Product galleries, sizes, quantity selection and delivery UI
- Persistent wishlist and bag using localStorage
- Demo UPI, card and COD checkout
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

The checkout is a UI demonstration. It does not process payments, store card details, create real shipments or connect to an existing database.
