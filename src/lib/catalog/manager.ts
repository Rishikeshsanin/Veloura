import { fallbackProducts } from '../../data/fallback'
import type { Product } from '../../types'
import { catalogProviders, isUsableImage, normalizeImageUrl, type ProviderId } from './providers'

const ALLOWED_CATEGORIES = new Set([
  'womens-dresses',
  'womens-bags',
  'womens-shoes',
  'womens-jewellery',
  'womens-tops',
  'womens-beauty',
  'womens-coords',
  'womens-ethnicwear',
  'womens-activewear',
  'womens-winterwear',
])

const CACHE_KEY = 'veloura:catalog:v4'
const CACHE_TTL = 12 * 60 * 1000
const CATEGORY_LIMIT = 42

export type ProviderHealth = {
  id: ProviderId | 'curated' | 'cache'
  label: string
  status: 'ready' | 'failed' | 'cached'
  count: number
  durationMs: number
  message?: string
}

let catalogCache: Product[] | null = null
let pendingCatalog: Promise<Product[]> | null = null
let providerHealth: ProviderHealth[] = []

function imageIdentity(url: string) {
  try {
    const parsed = new URL(normalizeImageUrl(url))
    parsed.search = ''
    parsed.hash = ''
    return `${parsed.hostname}${parsed.pathname}`.toLowerCase()
  } catch {
    return normalizeImageUrl(url).split('?')[0].toLowerCase()
  }
}

function productIdentity(product: Product) {
  const clean = (value?: string) => (value ?? '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
  return `${clean(product.brand)}::${clean(product.title)}`
}

function qualityScore(product: Product) {
  const sourceWeight: Record<string, number> = {
    curated: 25,
    dummyjson: 20,
    fakestore: 15,
    platzi: 12,
    makeup: 10,
  }
  return (sourceWeight[product.source ?? ''] ?? 0)
    + Math.min(product.images?.length ?? 0, 4) * 4
    + Math.min(product.description?.length ?? 0, 220) / 35
    + (product.brand ? 3 : 0)
    + (product.rating ?? 0) * 2
}

function sanitizeProduct(product: Product): Product | null {
  if (product.gender !== 'women' || !ALLOWED_CATEGORIES.has(product.category)) return null
  const images = Array.from(new Set([...(product.images ?? []), product.thumbnail]
    .map(normalizeImageUrl)
    .filter(isUsableImage)))
  if (!images.length || !product.title?.trim()) return null
  return {
    ...product,
    title: product.title.trim(),
    description: product.description?.trim() || 'Selected for the Veloura women’s edit.',
    thumbnail: images[0],
    images,
    rating: Math.max(3.8, Math.min(5, product.rating ?? 4.4)),
    stock: Math.max(0, product.stock ?? 18),
  }
}

function dedupeAndBalance(input: Product[]) {
  const sanitized = input.map(sanitizeProduct).filter((product): product is Product => Boolean(product))
  sanitized.sort((a, b) => qualityScore(b) - qualityScore(a))

  const seenProducts = new Set<string>()
  const seenPrimaryImages = new Set<string>()
  const accepted: Product[] = []

  for (const product of sanitized) {
    const identity = productIdentity(product)
    if (seenProducts.has(identity)) continue

    const candidates = product.images.filter((image) => !seenPrimaryImages.has(imageIdentity(image)))
    if (!candidates.length) continue

    const primary = candidates[0]
    const remaining = product.images.filter((image) => image !== primary)
    accepted.push({ ...product, thumbnail: primary, images: [primary, ...remaining] })
    seenProducts.add(identity)
    seenPrimaryImages.add(imageIdentity(primary))
  }

  const categoryCounts = new Map<string, number>()
  return accepted.filter((product) => {
    const count = categoryCounts.get(product.category) ?? 0
    if (count >= CATEGORY_LIMIT) return false
    categoryCounts.set(product.category, count + 1)
    return true
  })
}

function readSessionCache() {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as { expires: number; products: Product[] }
    if (!parsed.products?.length || Date.now() > parsed.expires) {
      sessionStorage.removeItem(CACHE_KEY)
      return null
    }
    return parsed.products
  } catch {
    return null
  }
}

function writeSessionCache(products: Product[]) {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ expires: Date.now() + CACHE_TTL, products }))
  } catch {
    // Storage can be unavailable in private browsing. The in-memory cache still works.
  }
}

async function loadProvider(provider: (typeof catalogProviders)[number]) {
  const started = performance.now()
  try {
    const products = await provider.load()
    providerHealth.push({
      id: provider.id,
      label: provider.label,
      status: 'ready',
      count: products.length,
      durationMs: Math.round(performance.now() - started),
    })
    return products
  } catch (error) {
    providerHealth.push({
      id: provider.id,
      label: provider.label,
      status: 'failed',
      count: 0,
      durationMs: Math.round(performance.now() - started),
      message: error instanceof Error ? error.message : 'Unknown provider error',
    })
    return []
  }
}

export async function fetchManagedCatalog(forceRefresh = false): Promise<Product[]> {
  if (!forceRefresh && catalogCache) return catalogCache
  if (!forceRefresh && pendingCatalog) return pendingCatalog

  if (!forceRefresh) {
    const cached = readSessionCache()
    if (cached?.length) {
      catalogCache = cached
      providerHealth = [{ id: 'cache', label: 'Session cache', status: 'cached', count: cached.length, durationMs: 0 }]
      return cached
    }
  }

  pendingCatalog = (async () => {
    providerHealth = []
    const providerResults = await Promise.all(catalogProviders.map(loadProvider))
    providerHealth.push({ id: 'curated', label: 'Veloura curated reserve', status: 'ready', count: fallbackProducts.length, durationMs: 0 })

    const catalog = dedupeAndBalance([...providerResults.flat(), ...fallbackProducts])
    const finalCatalog = catalog.length >= 18 ? catalog : dedupeAndBalance([...fallbackProducts, ...providerResults.flat()])

    catalogCache = finalCatalog
    writeSessionCache(finalCatalog)

    if (import.meta.env.DEV) {
      console.table(providerHealth.map(({ id, status, count, durationMs, message }) => ({ id, status, count, durationMs, message })))
      console.info(`[Veloura Catalog] ${finalCatalog.length} unique women’s products after quality gates and image dedupe.`)
    }

    return finalCatalog
  })()

  try {
    return await pendingCatalog
  } finally {
    pendingCatalog = null
  }
}

export async function fetchManagedProduct(id: string | number) {
  const catalog = await fetchManagedCatalog()
  return catalog.find((product) => product.id === Number(id)) ?? null
}

export async function searchManagedCatalog(query: string) {
  const catalog = await fetchManagedCatalog()
  const needle = query.trim().toLowerCase()
  if (!needle) return catalog
  return catalog.filter((product) => [
    product.title,
    product.description,
    product.brand,
    product.category,
    product.occasion,
    product.color,
    ...(product.tags ?? []),
  ].filter(Boolean).join(' ').toLowerCase().includes(needle))
}

export function getCatalogDiagnostics() {
  return providerHealth.map((entry) => ({ ...entry }))
}

export function clearCatalogCache() {
  catalogCache = null
  try { sessionStorage.removeItem(CACHE_KEY) } catch { /* noop */ }
}
