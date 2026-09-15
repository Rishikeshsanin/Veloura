import type { Product } from '../../../types'
import {
  deterministicDiscount,
  deterministicStock,
  fetchProviderText,
  inferCategory,
  postProviderJson,
  sizesForCategory,
  stableHash,
  stableNumericId,
  uniqueExternalImages,
  type ManagedProvider,
} from './shared'

type DirectoryEntry = {
  name: string
  store: string
  description: string
}

type MockShopProduct = {
  id: string
  title: string
  handle: string
  description?: string
  productType?: string
  vendor?: string
  tags?: string[]
  featuredImage?: { url?: string } | null
  images?: { nodes?: Array<{ url?: string }> }
  priceRange?: { minVariantPrice?: { amount?: string; currencyCode?: string } }
  variants?: { nodes?: Array<{ availableForSale?: boolean }> }
}

type MockShopResponse = {
  data?: { products?: { nodes?: MockShopProduct[] } }
  errors?: Array<{ message?: string }>
}

const productsQuery = `
  query VelouraCatalog {
    products(first: 80) {
      nodes {
        id
        title
        handle
        description
        productType
        vendor
        tags
        featuredImage { url }
        images(first: 8) { nodes { url } }
        priceRange { minVariantPrice { amount currencyCode } }
        variants(first: 1) { nodes { availableForSale } }
      }
    }
  }
`

const directoryCache: { expires: number; entries: DirectoryEntry[] } = { expires: 0, entries: [] }
const storeCache = new Map<string, { expires: number; products: Product[] }>()
const CACHE_TTL = 30 * 60 * 1000

const generalKeywords = [
  'woman', 'women', 'apparel', 'fashion', 'clothing', 'dress', 'blouse', 'trouser',
  'loungewear', 'shoe', 'footwear', 'bag', 'handbag', 'jewel', 'accessor', 'beauty',
  'cosmetic', 'skin', 'hair', 'fragrance', 'perfume', 'swim', 'lingerie', 'activewear',
]

const categoryKeywords: Record<string, string[]> = {
  'womens-dresses': ['dress', 'apparel', 'fashion', 'women'],
  'womens-tops': ['blouse', 'top', 'shirt', 'apparel', 'women'],
  'womens-coords': ['outfit set', 'set', 'loungewear', 'apparel', 'women'],
  'womens-ethnicwear': ['ethnic', 'traditional', 'apparel', 'women'],
  'womens-bottoms': ['trouser', 'pants', 'skirt', 'bottom', 'women'],
  'womens-denim': ['denim', 'jeans', 'apparel', 'women'],
  'womens-outerwear': ['blazer', 'coat', 'jacket', 'outerwear', 'women'],
  'womens-activewear': ['active', 'athletic', 'sportswear', 'fitness', 'women'],
  'womens-winterwear': ['cardigan', 'sweater', 'knit', 'coat', 'women'],
  'womens-swimwear': ['swim', 'bikini', 'beach', 'women'],
  'womens-lingerie': ['lingerie', 'intimate', 'underwear', 'women'],
  'womens-sleepwear': ['sleep', 'lounge', 'pajama', 'women'],
  'womens-shoes': ['shoe', 'footwear', 'sneaker', 'heel', 'women'],
  'womens-bags': ['bag', 'handbag', 'tote', 'purse', 'women'],
  'womens-jewellery': ['jewel', 'earring', 'necklace', 'bracelet', 'women'],
  'womens-watches': ['watch', 'timepiece', 'women'],
  'womens-sunglasses': ['sunglass', 'eyewear', 'women'],
  'womens-accessories': ['accessor', 'scarf', 'belt', 'women'],
  'womens-beauty': ['beauty', 'cosmetic', 'makeup', 'women'],
  'womens-skincare': ['skin', 'skincare', 'beauty', 'women'],
  'womens-haircare': ['hair', 'beauty', 'women'],
  'womens-fragrance': ['fragrance', 'perfume', 'scent', 'women'],
}

async function getDirectory() {
  if (directoryCache.entries.length && directoryCache.expires > Date.now()) return directoryCache.entries

  const text = await fetchProviderText('/catalog-source/mock-directory')
  const entries: DirectoryEntry[] = []
  const regex = /^- \[([^\]]+)\]\(https:\/\/([a-z0-9-]+)\.mock\.shop\/api\):\s*(.+)$/gim
  let match: RegExpExecArray | null
  while ((match = regex.exec(text))) {
    entries.push({ name: match[1].trim(), store: match[2].trim(), description: match[3].trim() })
  }

  if (!entries.length) throw new Error('Shopify mock.shop directory returned no parseable stores')
  directoryCache.entries = entries
  directoryCache.expires = Date.now() + CACHE_TTL
  return entries
}

function scoreEntry(entry: DirectoryEntry, keywords: string[]) {
  const text = `${entry.name} ${entry.description}`.toLowerCase()
  let score = 0
  for (const keyword of keywords) {
    if (text.includes(keyword)) score += keyword === 'women' || keyword === 'woman' ? 8 : 3
  }
  if (/\bmen'?s\b|\bmens\b|\bmale\b/.test(text) && !/women|woman/.test(text)) score -= 12
  return score
}

async function loadStore(entry: DirectoryEntry) {
  const cached = storeCache.get(entry.store)
  if (cached && cached.expires > Date.now()) return cached.products

  const payload = await postProviderJson<MockShopResponse>(`/catalog-source/mockshop/${entry.store}`, { query: productsQuery })
  if (payload.errors?.length) throw new Error(payload.errors.map((error) => error.message).filter(Boolean).join('; ') || `${entry.name} GraphQL error`)

  const products = (payload.data?.products?.nodes ?? []).map<Product | null>((item) => {
    const text = `${item.title} ${item.productType ?? ''} ${item.description ?? ''} ${(item.tags ?? []).join(' ')}`
    if (/\bmen'?s\b|\bmens\b|\bmale\b|\bboy\b/i.test(text) && !/women|woman|female/i.test(text)) return null

    const category = inferCategory(text, 'womens-tops')
    const images = uniqueExternalImages([item.featuredImage?.url, ...(item.images?.nodes ?? []).map((image) => image.url)])
    if (!images.length) return null

    const amount = Number(item.priceRange?.minVariantPrice?.amount)
    const seedKey = `${entry.store}:${item.id || item.handle || item.title}`
    const seed = stableHash(seedKey)

    return {
      id: stableNumericId(620000, seedKey),
      title: item.title,
      description: item.description?.trim() || `Women’s ${category.replace('womens-', '').replaceAll('-', ' ')} from ${entry.name}.`,
      category,
      price: Number.isFinite(amount) && amount > 0 ? amount : 45 + (seed % 120),
      discountPercentage: deterministicDiscount(seed, 10, 30),
      rating: 4.3 + (seed % 7) / 10,
      stock: item.variants?.nodes?.[0]?.availableForSale === false ? 0 : deterministicStock(seed),
      brand: item.vendor?.trim() || entry.name,
      thumbnail: images[0],
      images,
      tags: ['women', 'shopify', entry.store, item.productType ?? '', ...(item.tags ?? [])].filter(Boolean),
      gender: 'women',
      source: 'mockshop',
      sourceId: seedKey,
      sourceLabel: `Shopify mock.shop · ${entry.name}`,
      sizes: sizesForCategory(category),
    }
  }).filter((product): product is Product => Boolean(product))

  storeCache.set(entry.store, { expires: Date.now() + CACHE_TTL, products })
  return products
}

async function loadRankedStores(keywords: string[], maxStores: number) {
  const directory = await getDirectory()
  const ranked = directory
    .map((entry) => ({ entry, score: scoreEntry(entry, keywords) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxStores)

  const settled = await Promise.allSettled(ranked.map(({ entry }) => loadStore(entry)))
  return settled.flatMap((result) => result.status === 'fulfilled' ? result.value : [])
}

async function loadMockShopNetwork() {
  return loadRankedStores(generalKeywords, 5)
}

export async function fetchMockShopCategory(category: string) {
  const keywords = categoryKeywords[category] ?? ['women', 'fashion']
  const products = await loadRankedStores(keywords, 4)
  return products.filter((product) => product.category === category)
}

export const mockShopNetworkProvider: ManagedProvider = {
  id: 'mockshop-network',
  label: 'Shopify mock.shop women network',
  priority: 118,
  load: loadMockShopNetwork,
}
