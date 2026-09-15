import type { Product } from '../../types'
import { fetchMockShopCategory } from './providers/mockShopNetwork'
import { fetchVaanzariEthnic } from './providers/vaanzari'
import {
  deterministicDiscount,
  deterministicStock,
  fetchProviderJson,
  sizesForCategory,
  stableHash,
  stableNumericId,
  uniqueExternalImages,
} from './providers/shared'

type LooseObject = Record<string, unknown>

type SoleScoutPayload = {
  total?: number
  page?: number
  count?: number
  results?: LooseObject[]
}

type BeautyProduct = {
  code?: string
  product_name?: string
  brands?: string
  categories?: string
  quantity?: string
  image_url?: string
  image_front_url?: string
  image_ingredients_url?: string
  image_packaging_url?: string
}

type BeautyPayload = { products?: BeautyProduct[] }

const TARGET_PER_CATEGORY = 100
const CATEGORY_CACHE_TTL = 30 * 60 * 1000

const FASHION_TERMS: Record<string, string[]> = {
  'womens-dresses': ['women dress', 'women maxi dress', 'women mini dress', 'women casual dress'],
  'womens-tops': ['women top', 'women blouse', 'women shirt', 'women tee'],
  'womens-coords': ['women matching set', 'women two piece set', 'women outfit set', 'women tracksuit'],
  'womens-ethnicwear': ['women kurta', 'women saree', 'women salwar', 'women lehenga'],
  'womens-bottoms': ['women trousers', 'women skirt', 'women pants', 'women shorts'],
  'womens-denim': ['women jeans', 'women denim', 'women jean jacket', 'women denim shorts'],
  'womens-outerwear': ['women blazer', 'women jacket', 'women coat', 'women trench'],
  'womens-activewear': ['women activewear', 'women leggings', 'women sports bra', 'women training'],
  'womens-winterwear': ['women sweater', 'women cardigan', 'women hoodie', 'women winter jacket'],
  'womens-swimwear': ['women swimsuit', 'women bikini', 'women swimwear', 'women beachwear'],
  'womens-lingerie': ['women lingerie', 'women bralette', 'women bra', 'women underwear'],
  'womens-sleepwear': ['women pajamas', 'women sleepwear', 'women loungewear', 'women nightwear'],
  'womens-shoes': ['women sneakers', 'women heels', 'women sandals', 'women boots'],
  'womens-bags': ['women handbag', 'women tote bag', 'women shoulder bag', 'women crossbody'],
  'womens-jewellery': ['women earrings', 'women necklace', 'women bracelet', 'women ring'],
  'womens-watches': ['women watch', 'ladies watch', 'women smartwatch', 'women bracelet watch'],
  'womens-sunglasses': ['women sunglasses', 'women eyewear', 'women shades', 'ladies sunglasses'],
  'womens-accessories': ['women scarf', 'women belt', 'women cap', 'women accessories'],
}

const BEAUTY_TERMS: Record<string, string[]> = {
  'womens-beauty': ['cosmetics', 'makeup', 'lipstick', 'mascara'],
  'womens-skincare': ['skin-care', 'face-care', 'sunscreen', 'moisturizers'],
  'womens-haircare': ['hair-care', 'shampoo', 'conditioner', 'hair-treatments'],
  'womens-fragrance': ['perfumes', 'fragrances', 'eau-de-parfum', 'body-mists'],
}

const memoryCache = new Map<string, { expires: number; products: Product[] }>()

function isRecord(value: unknown): value is LooseObject {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function pickString(item: LooseObject, keys: string[]) {
  for (const key of keys) {
    const value = item[key]
    if (typeof value === 'string' && value.trim()) return value.trim()
  }
  return ''
}

function pickNumber(item: LooseObject, keys: string[]) {
  for (const key of keys) {
    const value = item[key]
    const parsed = typeof value === 'number'
      ? value
      : typeof value === 'string'
        ? Number(value.replace(/[^0-9.]/g, ''))
        : Number.NaN
    if (Number.isFinite(parsed) && parsed > 0) return parsed
  }
  return undefined
}

function collectImages(item: LooseObject) {
  const values: Array<string | null | undefined> = []
  for (const key of ['image', 'image_url', 'imageUrl', 'thumbnail', 'thumbnail_url', 'photo', 'cover', 'picture']) {
    const value = item[key]
    if (typeof value === 'string') values.push(value)
  }
  const images = item.images
  if (Array.isArray(images)) {
    images.forEach((entry) => {
      if (typeof entry === 'string') values.push(entry)
      if (isRecord(entry)) values.push(pickString(entry, ['url', 'src', 'image_url', 'imageUrl', 'thumbnail_url']))
    })
  }
  return uniqueExternalImages(values)
}

function normalizeSoleScout(item: LooseObject, category: string): Product | null {
  const title = pickString(item, ['title', 'name', 'product_name', 'model'])
  if (!title || /\bmen'?s\b|\bmens\b|\bmale\b|\bboy\b/i.test(title)) return null

  const slug = pickString(item, ['slug', 'style_code', 'sku']) || title
  const images = collectImages(item)
  if (!images.length) return null

  const current = pickNumber(item, ['lowest_price_usd', 'price_usd', 'lowest_price', 'price', 'current_price'])
  const retail = pickNumber(item, ['retail_price_usd', 'retail_price', 'msrp', 'original_price'])
  const seed = stableHash(slug)
  const price = retail || current || 40 + (seed % 130)
  const discount = retail && current && retail > current
    ? Math.round((1 - current / retail) * 100)
    : deterministicDiscount(seed, 10, 34)

  return {
    id: stableNumericId(810000, slug),
    title,
    description: `Women’s ${category.replace('womens-', '').replaceAll('-', ' ')} style discovered across the Veloura marketplace network.`,
    category,
    price,
    discountPercentage: Math.max(0, Math.min(75, discount)),
    rating: 4.1 + (seed % 9) / 10,
    stock: deterministicStock(seed),
    brand: pickString(item, ['brand', 'brand_name', 'manufacturer']) || 'Marketplace Edit',
    sku: pickString(item, ['style_code', 'sku']) || undefined,
    thumbnail: images[0],
    images,
    tags: ['women', 'marketplace', category.replace('womens-', '')],
    gender: 'women',
    source: 'solescout',
    sourceId: slug,
    sourceUrl: pickString(item, ['url', 'product_url']) || `https://solescout.ai/search?q=${encodeURIComponent(title)}`,
    sourceLabel: 'SoleScout deep catalog',
    color: pickString(item, ['color', 'colour']) || undefined,
    sizes: sizesForCategory(category),
  }
}

async function loadFashionCategory(category: string) {
  const terms = FASHION_TERMS[category] ?? []
  if (!terms.length) return []

  const requests = terms.flatMap((term) => [1, 2, 3].map(async (page) => {
    const payload = await fetchProviderJson<SoleScoutPayload>(
      `/catalog-source/solescout?q=${encodeURIComponent(term)}&page=${page}&limit=25`,
    )
    return (payload.results ?? []).map((item) => normalizeSoleScout(item, category)).filter((item): item is Product => Boolean(item))
  }))

  const settled = await Promise.allSettled(requests)
  return settled.flatMap((result) => result.status === 'fulfilled' ? result.value : [])
}

function normalizeBeauty(item: BeautyProduct, category: string): Product | null {
  const title = item.product_name?.trim() || ''
  const images = uniqueExternalImages([item.image_front_url, item.image_url, item.image_packaging_url, item.image_ingredients_url])
  if (!title || !images.length) return null

  const seedKey = item.code || `${title}:${item.brands ?? ''}`
  const seed = stableHash(seedKey)
  return {
    id: stableNumericId(870000, seedKey),
    title,
    description: `${item.brands ? `${item.brands}. ` : ''}${item.categories || category.replace('womens-', '').replaceAll('-', ' ')}${item.quantity ? ` · ${item.quantity}` : ''}`,
    category,
    price: 8 + (seed % 65),
    discountPercentage: deterministicDiscount(seed, 8, 27),
    rating: 4 + (seed % 10) / 10,
    stock: deterministicStock(seed),
    brand: item.brands?.split(',')[0]?.trim() || 'Beauty Edit',
    thumbnail: images[0],
    images,
    tags: ['women', 'beauty', category.replace('womens-', '')],
    gender: 'women',
    source: 'openbeauty',
    sourceId: seedKey,
    sourceLabel: 'Open Beauty Facts deep catalog',
    sizes: ['One Size'],
  }
}

async function loadBeautyCategory(category: string) {
  const terms = BEAUTY_TERMS[category] ?? []
  if (!terms.length) return []
  const fields = 'code,product_name,brands,categories,quantity,image_url,image_front_url,image_ingredients_url,image_packaging_url'
  const requests = terms.flatMap((term) => [1, 2].map(async (page) => {
    const url = `/catalog-source/openbeauty?categories_tags_en=${encodeURIComponent(term)}&page=${page}&page_size=60&fields=${fields}`
    const payload = await fetchProviderJson<BeautyPayload>(url)
    return (payload.products ?? []).map((item) => normalizeBeauty(item, category)).filter((item): item is Product => Boolean(item))
  }))
  const settled = await Promise.allSettled(requests)
  return settled.flatMap((result) => result.status === 'fulfilled' ? result.value : [])
}

function dedupe(products: Product[]) {
  const seen = new Set<string>()
  const seenImages = new Set<string>()
  const accepted: Product[] = []
  for (const product of products) {
    const key = `${(product.brand ?? '').toLowerCase()}::${product.title.toLowerCase().replace(/[^a-z0-9]+/g, ' ')}`
    const imageKey = product.thumbnail.toLowerCase()
    if (seen.has(key) || seenImages.has(imageKey)) continue
    seen.add(key)
    seenImages.add(imageKey)
    accepted.push(product)
    if (accepted.length >= TARGET_PER_CATEGORY) break
  }
  return accepted
}

export async function fetchCategoryExpansion(category: string): Promise<Product[]> {
  const cached = memoryCache.get(category)
  if (cached && cached.expires > Date.now()) return cached.products

  const [fashion, beauty, shopify, ethnic] = await Promise.all([
    loadFashionCategory(category),
    loadBeautyCategory(category),
    fetchMockShopCategory(category).catch(() => []),
    category === 'womens-ethnicwear' ? fetchVaanzariEthnic().catch(() => []) : Promise.resolve([]),
  ])
  const products = dedupe([...ethnic, ...shopify, ...fashion, ...beauty])
  memoryCache.set(category, { expires: Date.now() + CATEGORY_CACHE_TTL, products })
  return products
}

export function clearCategoryExpansionCache() {
  memoryCache.clear()
}
