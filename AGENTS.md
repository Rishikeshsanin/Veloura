# Veloura Agent Safety Contract

This repository is the only application scope for **Veloura**.

## Identity
- Application: Veloura
- Project Hub slug/schema: `veloura`
- Repository: `https://github.com/Rishikeshsanin/Veloura`
- Production: Vercel project `veloura`

## Repository safety
1. Do not modify any other repository, deployment, database schema, storage bucket, function or application.
2. Preserve existing Veloura storefront data contracts and localStorage keys unless a migration is explicitly implemented.
3. Prefer isolated branches, reversible changes and production-equivalent preview builds before merging.
4. Never commit passwords, database credentials, service-role keys or private secrets.
5. Destructive production/database operations require explicit user confirmation.

## Supabase Project Hub safety
1. Veloura may only use the dedicated `veloura` schema and Veloura-prefixed resources.
2. Never create Veloura application tables in `public`.
3. Never modify another application's schema or data.
4. Never create cross-app foreign keys, views, triggers or dependencies.
5. Never use the shared Project Hub service-role/secret key as an application credential.
6. Use a dedicated backend role if server-side database access is activated.
7. Every user-facing table must have RLS enabled before production access.
8. Project-wide Auth/OAuth, keys, plan, region and exposed-schema settings are out of scope unless separately reviewed.

## Current V10 persistence strategy
- Existing cart, wishlist, recently-viewed and preference keys remain backward compatible.
- Orders, saved addresses, coupons and saved-for-later state use new Veloura-specific versioned keys.
- The storefront remains functional without Supabase.
- Server persistence must degrade gracefully to local persistence if the backend is unavailable.
