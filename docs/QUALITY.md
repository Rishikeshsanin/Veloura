# Veloura quality gates

Veloura V14 treats QA as a permanent part of the repository rather than a one-off release checklist.

## Blocking pull-request checks

### Build
- TypeScript application check
- Vite production build

### Browser quality
- Chromium desktop smoke tests
- Chromium mobile-emulation smoke tests
- Firefox desktop smoke tests
- WebKit desktop smoke tests
- WebKit iPhone mobile-emulation smoke tests
- mobile horizontal-overflow regression checks
- Compare Tray vs mobile bottom-dock collision check
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

### V14 measured performance work

V14 used the V13 Lighthouse run as a baseline rather than optimizing by guesswork.

Representative Home changes:
- performance score: **0.41 → ~0.50** in the final CI run (an intermediate run reached 0.53; synthetic scores vary)
- total blocking time: **3.63 s → ~0.84 s**
- transfer size: **2.23 MiB → ~0.73 MiB**
- responsive-image estimated waste: **1.52 MiB → ~0.20 MiB**
- cumulative layout shift: **0 → 0**

The main fixes were:
- a Home-only lighter catalog fetch path instead of the full provider fan-out
- responsive Unsplash delivery without rewriting provider URLs globally
- secondary product images requested on interaction rather than eagerly
- deferred deep Home rails with layout-preserving inert space
- HTML discovery/preload of the Home LCP hero
- Lighthouse SEO scoring on public pages instead of deliberately noindexed account/login routes

The remaining responsive-image opportunity is primarily on third-party provider images that do not expose a safe transformation contract. Veloura intentionally does not rewrite those URLs because provider query parameters and image endpoints are functional data, not generic CDN syntax.

The initial JS bundle remains roughly **486 kB / 140 kB gzip**. Auth/session restoration and cloud commerce sync are global correctness boundaries, so V14 does not defer or weaken them purely to chase a synthetic score. Likewise, the layered historical CSS is not aggressively purged without route-by-route proof because it contains previous regression fixes and responsive behavior.

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
- Desktop Safari emulation in WebKit
- iPhone 13 mobile emulation in WebKit

The cross-browser matrix catches layout and interaction regressions across Chromium, Firefox and WebKit engines. Emulation is still not a substitute for physical-device QA, so physical iOS/Safari and Android checks remain a manual release sanity check when a real-device lab is available.

## Current commerce boundary

Payment processing and physical fulfilment are still intentionally sandboxed. QA must not treat a saved Veloura order as a real charge or courier shipment.
