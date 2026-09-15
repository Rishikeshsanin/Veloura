import type { Product } from '../../../types'
import { deterministicDiscount, deterministicStock, fetchProviderJson, inferCategory, normalizeImageUrl, sizesForCategory, stableHash, stableNumericId, uniqueExternalImages, type ManagedProvider } from './shared'

type LooseObject = Record<string, unknown>

function isRecord(value: unknown): value is LooseObject {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function unwrapArray(payload: unknown): LooseObject[] {
  if (Array.isArray(payload)) return payload.filter(isRecord)
  if (!isRecord(payload)) return []
  for (const key of ['results', 'data', 'products', 'items']) {
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

function normalizeStoreImage(value: unknown) {
  if (typeof value !== 'string' || !value.trim()) return ''
  const clean = value.trim()
  if (/^https?:\/\//i.test(clean)) return normalizeImageUrl(clean)
  if (clean.startsWith('/')) return `https://free-e-store-api.onrender.com${clean}`
  return `https://free-e-store-api.onrender.com/images/products/${clean}`
}

const womenSignals = /women|woman|ladies|female|dress|skirt|blouse|top|heel|bag|purse|jewel|beauty|makeup|bra|bikini|sunglass|perfume|fashion/i
const menSignals = /\bmen'?s\b|\bmens\b|\bmale\b|\bboy\b/i

async function loadFreeEStore() {
  const payload = await fetchProviderJson<unknown>('/catalog-source/freeestore')

  return unwrapArray(payload).map<Product | null>((item) => {
    const title = pickString(item, ['title', 'name', 'productName'])
    const description = pickString(item, ['description', 'shortDescription', 'details'])
    const rawCategory = isRecord(item.category) ? pickString(item.category, ['name', 'title', 'slug']) : pickString(item, ['category', 'categoryName'])
    const text = `${title} ${description} ${rawCategory}`
    if (!title || menSignals.test(text) || !womenSignals.test(text)) return null

    const idValue = String(item.id ?? item._id ?? title)
    const category = inferCategory(text)
    const imageValues: string[] = []
    if (Array.isArray(item.images)) item.images.forEach((value) => { const image = normalizeStoreImage(value); if (image) imageValues.push(image) })
    const oneImage = normalizeStoreImage(item.image)
    if (oneImage) imageValues.push(oneImage)
    const images = uniqueExternalImages(imageValues)
    const seed = stableHash(idValue)

    return {
      id: stableNumericId(900000, idValue),
      title,
      description: description || 'Women’s fashion product selected for the Veloura marketplace catalog.',
      category,
      price: pickNumber(item, ['price', 'salePrice', 'mrp']) || 25 + (seed % 90),
      discountPercentage: deterministicDiscount(seed, 10, 35),
      rating: pickNumber(item, ['rating', 'ratingsAverage']) || 4 + (seed % 9) / 10,
      stock: pickNumber(item, ['quantity', 'stock']) || deterministicStock(seed),
      brand: pickString(item, ['brand', 'brandName']) || rawCategory || 'Free Store Edit',
      thumbnail: images[0] ?? '',
      images,
      tags: ['women', rawCategory].filter(Boolean),
      gender: 'women',
      source: 'freeestore',
      sourceId: idValue,
      sourceLabel: 'Free E-Store API',
      sizes: sizesForCategory(category),
    }
  }).filter((product): product is Product => Boolean(product)).slice(0, 140)
}

export const freeEStoreProvider: ManagedProvider = {
  id: 'freeestore',
  label: 'Free E-Store API',
  priority: 76,
  load: loadFreeEStore,
}
