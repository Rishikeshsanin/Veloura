import type { Product } from '../../../types'
import { deterministicDiscount, deterministicStock, fetchProviderJson, inferCategory, sizesForCategory, stableHash, stableNumericId, uniqueExternalImages, type ManagedProvider } from './shared'

type LooseObject = Record<string, unknown>

function isRecord(value: unknown): value is LooseObject {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function unwrapArray(payload: unknown): LooseObject[] {
  if (Array.isArray(payload)) return payload.filter(isRecord)
  if (!isRecord(payload)) return []
  for (const key of ['results', 'data', 'products', 'items', 'hits']) {
    const value = payload[key]
    if (Array.isArray(value)) return value.filter(isRecord)
    if (isRecord(value)) {
      for (const inner of ['results', 'data', 'products', 'items']) {
        const nested = value[inner]
        if (Array.isArray(nested)) return nested.filter(isRecord)
      }
    }
  }
  return []
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
    const parsed = typeof value === 'number' ? value : typeof value === 'string' ? Number(value.replace(/[^0-9.]/g, '')) : NaN
    if (Number.isFinite(parsed) && parsed > 0) return parsed
  }
  return undefined
}

function collectImages(item: LooseObject) {
  const values: string[] = []
  for (const key of ['image', 'image_url', 'imageUrl', 'thumbnail', 'thumbnail_url', 'photo', 'cover', 'picture']) {
    const value = item[key]
    if (typeof value === 'string') values.push(value)
  }
  const images = item.images
  if (Array.isArray(images)) {
    images.forEach((entry) => {
      if (typeof entry === 'string') values.push(entry)
      if (isRecord(entry)) {
        const url = pickString(entry, ['url', 'src', 'image_url', 'imageUrl', 'thumbnail_url'])
        if (url) values.push(url)
      }
    })
  }
  return uniqueExternalImages(values)
}

const menSignals = /\bmen'?s\b|\bmens\b|\bmale\b|\bboy\b/i

const searches: Array<[string, string]> = [
  ['women sneakers', 'womens-shoes'],
  ['wmns shoes', 'womens-shoes'],
  ['women bags', 'womens-bags'],
  ['women dress', 'womens-dresses'],
  ['women skirt', 'womens-bottoms'],
  ['women jacket', 'womens-outerwear'],
  ['women apparel', 'womens-tops'],
  ['women sunglasses', 'womens-sunglasses'],
]

async function loadSoleScout() {
  const settled = await Promise.allSettled(searches.map(async ([query, fallbackCategory]) => {
    const payload = await fetchProviderJson<unknown>(`/catalog-source/solescout?q=${encodeURIComponent(query)}&limit=24`)

    return unwrapArray(payload).map<Product | null>((item) => {
      const title = pickString(item, ['title', 'name', 'product_name', 'model'])
      if (!title || menSignals.test(title)) return null
      const slug = pickString(item, ['slug', 'style_code', 'sku']) || title
      const category = inferCategory(`${title} ${pickString(item, ['category', 'type'])}`, fallbackCategory)
      const images = collectImages(item)
      const current = pickNumber(item, ['lowest_price_usd', 'price_usd', 'lowest_price', 'price', 'current_price'])
      const retail = pickNumber(item, ['retail_price_usd', 'retail_price', 'msrp', 'original_price'])
      const seed = stableHash(slug)
      const price = retail || current || 65 + (seed % 120)
      const computedDiscount = retail && current && retail > current ? Math.round((1 - current / retail) * 100) : deterministicDiscount(seed, 12, 32)

      return {
        id: stableNumericId(800000, slug),
        title,
        description: `Women’s ${category.replace('womens-', '').replaceAll('-', ' ')} style from a broad fashion marketplace index.`,
        category,
        price,
        discountPercentage: Math.max(0, Math.min(75, computedDiscount)),
        rating: 4.2 + (seed % 8) / 10,
        stock: deterministicStock(seed),
        brand: pickString(item, ['brand', 'brand_name', 'manufacturer']) || 'Marketplace Edit',
        sku: pickString(item, ['style_code', 'sku']) || undefined,
        thumbnail: images[0] ?? '',
        images,
        tags: ['women', 'marketplace', query],
        gender: 'women',
        source: 'solescout',
        sourceId: slug,
        sourceUrl: pickString(item, ['url', 'product_url']) || `https://solescout.ai/search?q=${encodeURIComponent(title)}`,
        sourceLabel: 'SoleScout discovery',
        sizes: sizesForCategory(category),
      }
    }).filter((product): product is Product => Boolean(product))
  }))

  return settled.flatMap((result) => result.status === 'fulfilled' ? result.value : [])
}

export const soleScoutProvider: ManagedProvider = {
  id: 'solescout',
  label: 'SoleScout women fashion discovery',
  priority: 90,
  load: loadSoleScout,
}
