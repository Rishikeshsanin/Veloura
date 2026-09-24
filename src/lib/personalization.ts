import type { Product } from '../types'

export type PreferenceSignals = {
  categories: Record<string, number>
  brands: Record<string, number>
  colors: Record<string, number>
  occasions: Record<string, number>
}

export const EMPTY_PREFERENCE_SIGNALS: PreferenceSignals = {
  categories: {},
  brands: {},
  colors: {},
  occasions: {},
}

function bump(map: Record<string, number>, raw: string | undefined, weight: number) {
  const key = raw?.trim()
  if (!key) return map
  const next = { ...map, [key]: Math.min(40, (map[key] ?? 0) + weight) }
  return Object.fromEntries(Object.entries(next).sort((a, b) => b[1] - a[1]).slice(0, 40))
}

export function addProductSignal(current: PreferenceSignals, product: Product, weight = 1): PreferenceSignals {
  return {
    categories: bump(current.categories, product.category, weight),
    brands: bump(current.brands, product.brand, weight),
    colors: bump(current.colors, product.color, Math.max(.5, weight * .7)),
    occasions: bump(current.occasions, product.occasion, Math.max(.5, weight * .7)),
  }
}

function quality(product: Product) {
  const gallery = Math.min(product.images?.length ?? 0, 6) * 1.25
  const rating = Math.max(0, (product.rating ?? 4.2) - 3.5) * 5
  const discount = Math.min(product.discountPercentage ?? 0, 55) / 18
  const stock = product.stock === 0 ? -12 : product.stock !== undefined && product.stock < 5 ? -1 : 1.5
  return gallery + rating + discount + stock
}

export function recommendForYou(
  catalog: Product[],
  signals: PreferenceSignals,
  excludedIds: Iterable<number> = [],
  limit = 18,
) {
  const excluded = new Set(excludedIds)
  return catalog
    .filter((product) => !excluded.has(product.id) && product.stock !== 0)
    .map((product) => {
      let score = quality(product)
      score += (signals.categories[product.category] ?? 0) * 3.6
      if (product.brand) score += (signals.brands[product.brand] ?? 0) * 3.1
      if (product.color) score += (signals.colors[product.color] ?? 0) * 1.8
      if (product.occasion) score += (signals.occasions[product.occasion] ?? 0) * 1.7
      return { product, score }
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ product }) => product)
}

export function topPreference(signals: PreferenceSignals, key: keyof PreferenceSignals) {
  return Object.entries(signals[key]).sort((a, b) => b[1] - a[1])[0]?.[0] ?? ''
}

export function scoreTrending(product: Product) {
  return quality(product)
    + Math.min(product.discountPercentage ?? 0, 60) / 8
    + ((product.rating ?? 0) >= 4.7 ? 4 : 0)
    + Math.min(product.reviews?.length ?? 0, 20) / 5
}

export function trendingProducts(catalog: Product[], limit = 18) {
  return [...catalog].sort((a, b) => scoreTrending(b) - scoreTrending(a)).slice(0, limit)
}
