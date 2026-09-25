# Veloura quality gates

Veloura V13 treats QA as a permanent part of the repository rather than a one-off release checklist.

## Blocking pull-request checks

### Build
- TypeScript application check
- Vite production build

### Browser quality
- Chromium desktop smoke tests
- Chromium mobile-emulation smoke tests
- critical axe accessibility checks
- compare-state persistence check
- storefront/account/navigation smoke tests
- robots.txt and sitemap availability
- npm audit at critical severity

## Lighthouse monitoring

Lighthouse CI runs against the production build for:
- performance
- accessibility
- best practices
- SEO
- responsive-image opportunities

The Lighthouse category thresholds are warnings rather than merge blockers because the catalog depends on third-party product images/APIs and synthetic CI performance varies. Browser/E2E and critical accessibility failures remain blocking.

## Security automation

- GitHub CodeQL runs on main and weekly.
- Dependabot checks npm dependencies weekly and GitHub Actions monthly.
- Supabase Security Advisor is checked during database/security migrations.
- Veloura database resources remain isolated to the `veloura` schema and Veloura-prefixed storage/RPC resources.

## Runtime observability

Signed-in frontend errors and unhandled promise rejections are recorded as account-scoped `frontend_error` commerce events. Error payloads are truncated and URLs are stripped before storage.

Vercel runtime errors remain the production backend/serverless signal.

## Device coverage

Automated browser coverage uses:
- Desktop Chromium
- Pixel 7 mobile emulation in Chromium
- Desktop Firefox
- iPhone 13 mobile emulation in WebKit

The cross-browser matrix catches layout and interaction regressions across Chromium, Firefox and WebKit engines. Emulation is still not a substitute for physical-device QA, so physical iOS/Safari and Android checks remain a manual release sanity check when a real-device lab is available.

## Current commerce boundary

Payment processing and physical fulfilment are still intentionally sandboxed. QA must not treat a saved Veloura order as a real charge or courier shipment.
