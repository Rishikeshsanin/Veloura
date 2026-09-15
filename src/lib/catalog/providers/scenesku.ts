import type { Product } from '../../../types'
import { deterministicDiscount, deterministicStock, fetchProviderJson, inferCategory, sizesForCategory, stableHash, stableNumericId, uniqueExternalImages, type ManagedProvider } from './shared'

type SceneImage = {
  image_url?: string
  thumbnail_url?: string
  title?: string
  index?: number
}

type ScenePack = {
  id?: string
  images?: SceneImage[]
  product_data?: {
    product_title?: string
    price?: string | number
    short_description?: string
    long_description?: string
    bullet_points?: string[]
    options?: Record<string, string[]>
    tags?: string[]
    categories?: string[]
  }
}

type ScenePayload = { data?: ScenePack[] }

async function loadSceneSku() {
  const endpoints: Array<[string, string]> = [
    ['https://scenesku.com/api/v1/public-packs/womens-fashion', 'womens-tops'],
    ['https://scenesku.com/api/v1/public-packs/shoes', 'womens-shoes'],
  ]

  const settled = await Promise.allSettled(endpoints.map(async ([url, fallbackCategory]) => {
    const payload = await fetchProviderJson<ScenePayload>(url)
    return (payload.data ?? []).map<Product | null>((pack) => {
      const data = pack.product_data ?? {}
      const title = data.product_title?.trim() || ''
      const text = [title, data.short_description, data.long_description, ...(data.tags ?? []), ...(data.categories ?? [])].filter(Boolean).join(' ')
      if (!title || /\bmen'?s\b|\bmens\b/i.test(text)) return null

      const category = inferCategory(text, fallbackCategory)
      const images = uniqueExternalImages((pack.images ?? []).flatMap((image) => [image.image_url, image.thumbnail_url]))
      const parsedPrice = Number(data.price)
      const seed = stableHash(pack.id || title)
      const sizeOptions = data.options?.Size || data.options?.size

      return {
        id: stableNumericId(500000, pack.id || title),
        title,
        description: data.long_description || data.short_description || 'Professional women’s fashion scene pack selected for Veloura.',
        category,
        price: Number.isFinite(parsedPrice) && parsedPrice > 0 ? parsedPrice : 65,
        discountPercentage: deterministicDiscount(seed, 10, 24),
        rating: 4.8 + (seed % 2) / 10,
        stock: deterministicStock(seed),
        brand: 'Veloura Studio',
        thumbnail: images[0] ?? '',
        images,
        tags: ['women', 'editorial', 'multi-image', ...(data.tags ?? [])],
        gender: 'women',
        source: 'scenesku',
        sourceId: pack.id || title,
        sourceLabel: 'SceneSKU multi-scene pack',
        sizes: sizeOptions?.length ? sizeOptions : sizesForCategory(category),
      }
    }).filter((product): product is Product => Boolean(product))
  }))

  return settled.flatMap((result) => result.status === 'fulfilled' ? result.value : [])
}

export const sceneSkuProvider: ManagedProvider = {
  id: 'scenesku',
  label: 'SceneSKU multi-scene fashion',
  priority: 120,
  load: loadSceneSku,
}
