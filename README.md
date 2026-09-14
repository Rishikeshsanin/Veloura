# Veloura Women

A large, women-only fashion marketplace experience built with React, TypeScript and Vite.

## What changed in V2

Veloura V2 is intentionally closer to a full fashion destination than a small portfolio storefront. It includes a high-density women’s homepage, live API-backed products, a curated fallback catalog, INR pricing, category merchandising, search, filtering, sorting, wishlist, cart, product detail pages and a complete demo checkout flow.

### Women-only categories

- Dresses
- Tops & tees
- Co-ords
- Ethnic wear
- Footwear
- Handbags
- Jewellery
- Beauty
- Activewear
- Winterwear

### Marketplace features

- Responsive marketplace-style homepage
- Women-only search and navigation
- High-resolution imagery
- Trending, deals, brands, occasion and budget rails
- Dense multi-column catalog
- Price, discount and rating filters
- Product galleries, sizes and quantity selection
- Persistent wishlist and bag using localStorage
- Indian Rupee pricing and offer language
- Demo UPI, card and COD checkout
- Graceful fallback catalog when the public API is unavailable

## Data

Veloura uses public DummyJSON product endpoints where relevant and normalizes them into a women-only catalog. A curated local catalog keeps the store visually complete if a public endpoint is unavailable or too small.

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
