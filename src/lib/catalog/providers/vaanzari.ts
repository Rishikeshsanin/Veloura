import type { Product } from '../../../types'
import {
  fetchProviderJson,
  stableNumericId,
  uniqueExternalImages,
  type ManagedProvider,
} from './shared'

type LooseObject = Record<string, unknown>

function isRecord(value: unknown): value is LooseObject {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function unwrap(payload: unknown): LooseObject[] {
  if (Array.isArray(payload)) return payload.filter(isRecord)
  if (!isRecord(payload)) return []
  for (const key of ['data','sarees','items','results','products']) {
    const value = payload[key]
    if (Array.isArray(value)) return value.filter(isRecord)
    if (isRecord(value)) {
      for (const inner of ['data','sarees','items','results','products']) {
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
    const parsed = typeof value === 'number' ? value : typeof value === 'string' ? Number(value.replace(/[^0-9.]/g,'')) : Number.NaN
    if (Number.isFinite(parsed) && parsed > 0) return parsed
  }
  return undefined
}

function collectImages(item: LooseObject) {
  const values: Array<string | null | undefined> = []
  for (const key of ['image','image_url','primary_image','thumbnail','thumbnail_url','featured_image','photo','cover_image']) {
    const value = item[key]
    if (typeof value === 'string') values.push(value)
    if (isRecord(value)) values.push(pickString(value, ['url','src','image_url','large','medium']))
  }
  for (const key of ['images','photos','gallery','media']) {
    const value = item[key]
    if (!Array.isArray(value)) continue
    value.forEach((entry) => {
      if (typeof entry === 'string') values.push(entry)
      if (isRecord(entry)) values.push(pickString(entry, ['url','src','image_url','large','medium','original']))
    })
  }
  return uniqueExternalImages(values)
}

function normalize(item: LooseObject): Product | null {
  const title = pickString(item, ['title','name','product_name','display_name','public_name'])
  const idValue = String(item.id ?? item.public_id ?? item.slug ?? item.code ?? title)
  const images = collectImages(item)
  if (!title || !images.length) return null

  const description = pickString(item, ['description','short_description','summary','story'])
  const material = pickString(item, ['material','fabric','silk_type'])
  const technique = pickString(item, ['technique','weave','weaving_method'])
  const color = pickString(item, ['color','colour','primary_color'])
  const occasion = pickString(item, ['occasion','occasion_name'])
  const directPrice = pickNumber(item, ['price','price_inr','selling_price','sale_price','amount'])
  if (!directPrice) return null

  return {
    id: stableNumericId(930000, idValue),
    title,
    description: description || [material, technique, color].filter(Boolean).join(' · ') || 'A Banarasi saree from Vaanzari’s public catalogue.',
    category: 'womens-ethnicwear',
    price: directPrice,
    brand: 'Vaanzari',
    thumbnail: images[0],
    images,
    tags: ['women','ethnic','saree','banarasi',material,technique,occasion].filter(Boolean) as string[],
    gender: 'women',
    source: 'vaanzari',
    sourceId: idValue,
    sourceUrl: pickString(item, ['url','product_url','canonical_url']) || undefined,
    sourceLabel: 'Vaanzari public saree catalogue',
    color: color || undefined,
    occasion: occasion || undefined,
  }
}

async function loadVaanzari() {
  const payload = await fetchProviderJson<unknown>('/catalog-source/vaanzari?limit=50')
  return unwrap(payload).map(normalize).filter((product): product is Product => Boolean(product))
}

export async function fetchVaanzariEthnic() {
  return loadVaanzari()
}

export const vaanzariProvider: ManagedProvider = {
  id: 'vaanzari',
  label: 'Vaanzari Banarasi sarees',
  priority: 110,
  load: loadVaanzari,
}
