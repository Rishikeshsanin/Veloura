import { WOMEN_CATEGORIES } from '../../data/catalog'
import { fallbackProducts } from '../../data/fallback'
import type { Product } from '../../types'
import { fetchCategoryExpansion, clearCategoryExpansionCache } from './categoryExpansion'
import { externalCatalogProviders } from './externalProviders'
import { catalogProviders, isUsableImage, normalizeImageUrl } from './providers'
import type { ManagedProvider } from './providers/shared'

const ALLOWED_CATEGORIES = new Set(WOMEN_CATEGORIES.map((category) => category.value))
const CACHE_KEY = 'veloura:catalog:v10'
const CACHE_TTL = 15 * 60 * 1000
const CATEGORY_LIMIT = 160
const CATEGORY_CACHE_TTL = 30 * 60 * 1000

const allProviders: ManagedProvider[] = [
  ...externalCatalogProviders,
  ...catalogProviders,
].sort((a, b) => b.priority - a.priority)

export type ProviderHealth = {
  id: string
  label: string
  status: 'ready' | 'failed' | 'cached'
  count: number
  durationMs: number
  message?: string
}

let catalogCache: Product[] | null = null
let pendingCatalog: Promise<Product[]> | null = null
let providerHealth: ProviderHealth[] = []
const categoryCache = new Map<string, { expires: number; products: Product[] }>()

function imageIdentity(url: string) {
  try {
    const parsed = new URL(normalizeImageUrl(url))
    parsed.hash = ''

    // Remove only visual-transform parameters. Product identity parameters such as
    // SoleScout's ?slug=...&sku=... MUST stay or thousands of distinct images
    // collapse into one /api/goat-image identity.
    const transformParams = new Set([
      'w', 'width', 'h', 'height', 'q', 'quality', 'auto', 'fit', 'crop',
      'fm', 'format', 'dpr', 'ixlib', 'rect', 'cs', 'bg', 'sat', 'con',
    ])
    for (const key of Array.from(parsed.searchParams.keys())) {
      if (transformParams.has(key.toLowerCase())) parsed.searchParams.delete(key)
    }

    const sorted = Array.from(parsed.searchParams.entries()).sort(([a], [b]) => a.localeCompare(b))
    const query = sorted.length ? `?${new URLSearchParams(sorted).toString()}` : ''
    return `${parsed.hostname}${parsed.pathname}${query}`.toLowerCase()
  } catch {
    return normalizeImageUrl(url).toLowerCase()
  }
}

function productIdentity(product: Product) {
  const clean = (value?: string) => (value ?? '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
  return `${clean(product.brand)}::${clean(product.title)}`
}

function qualityScore(product: Product) {
  const sourceWeight: Record<string, number> = {
    scenesku: 52,
    mockshop: 46,
    solescout: 36,
    dummyjson: 31,
    openbeauty: 29,
    curated: 24,
    fakestore: 17,
    makeup: 16,
    platzi: 13,
  }

  const imageCount = Math.min(product.images?.length ?? 0, 8)
  const galleryBonus = imageCount >= 5 ? 18 : imageCount >= 3 ? 12 : imageCount >= 2 ? 6 : 0

  return (sourceWeight[product.source ?? ''] ?? 0)
    + imageCount * 4
    + galleryBonus
    + Math.min(product.description?.length ?? 0, 260) / 40
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
    // The in-memory cache still works if storage quota/private browsing blocks this.
  }
}

async function loadProvider(provider: ManagedProvider) {
  const started = performance.now()
  try {
    const products = await provider.load()
    const durationMs = Math.round(performance.now() - started)
    if (!products.length) {
      providerHealth.push({
        id: provider.id,
        label: provider.label,
        status: 'failed',
        count: 0,
        durationMs,
        message: 'Connected, but returned no usable women’s products',
      })
      return []
    }

    providerHealth.push({
      id: provider.id,
      label: provider.label,
      status: 'ready',
      count: products.length,
      durationMs,
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
    const providerResults = await Promise.all(allProviders.map(loadProvider))
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

export async function fetchManagedCategory(category: string) {
  const base = await fetchManagedCatalog()
  if (!ALLOWED_CATEGORIES.has(category)) return base

  const cached = categoryCache.get(category)
  if (cached && cached.expires > Date.now()) return cached.products

  const expansion = await fetchCategoryExpansion(category)
  const merged = dedupeAndBalance([
    ...base.filter((product) => product.category === category),
    ...expansion,
    ...fallbackProducts.filter((product) => product.category === category),
  ]).filter((product) => product.category === category)

  categoryCache.set(category, { expires: Date.now() + CATEGORY_CACHE_TTL, products: merged })
  return merged
}

export async function fetchManagedProduct(id: string | number) {
  const catalog = await fetchManagedCatalog()
  const match = catalog.find((product) => product.id === Number(id))
  if (match) return match

  for (const category of WOMEN_CATEGORIES) {
    const cached = categoryCache.get(category.value)?.products
    const found = cached?.find((product) => product.id === Number(id))
    if (found) return found
  }
  return null
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
  categoryCache.clear()
  clearCategoryExpansionCache()
  try { sessionStorage.removeItem(CACHE_KEY) } catch { /* noop */ }
}
