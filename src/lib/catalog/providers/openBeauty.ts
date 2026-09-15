import type { Product } from '../../../types'
import { deterministicDiscount, deterministicStock, fetchProviderJson, stableHash, stableNumericId, uniqueExternalImages, type ManagedProvider } from './shared'

type BeautyProduct = {
  code?: string
  product_name?: string
  brands?: string
  categories?: string
  categories_tags?: string[]
  quantity?: string
  image_url?: string
  image_front_url?: string
  image_ingredients_url?: string
  image_packaging_url?: string
}

type BeautyPayload = { products?: BeautyProduct[] }

const queries: Array<[string, string]> = [
  ['makeup', 'womens-beauty'],
  ['lipsticks', 'womens-beauty'],
  ['skin-care', 'womens-skincare'],
  ['hair-care', 'womens-haircare'],
  ['perfumes', 'womens-fragrance'],
]

async function loadOpenBeautyFacts() {
  const fields = 'code,product_name,brands,categories,categories_tags,quantity,image_url,image_front_url,image_ingredients_url,image_packaging_url'
  const settled = await Promise.allSettled(queries.map(async ([query, category]) => {
    const url = `/catalog-source/openbeauty?categories_tags_en=${encodeURIComponent(query)}&page_size=36&fields=${fields}`
    const payload = await fetchProviderJson<BeautyPayload>(url)

    return (payload.products ?? []).map<Product | null>((item) => {
      const title = item.product_name?.trim() || ''
      if (!title) return null
      const images = uniqueExternalImages([item.image_front_url, item.image_url, item.image_packaging_url, item.image_ingredients_url])
      const seed = stableHash(item.code || title)

      return {
        id: stableNumericId(700000, item.code || title),
        title,
        description: `${item.brands ? `${item.brands}. ` : ''}${item.categories || 'Beauty product'}${item.quantity ? ` · ${item.quantity}` : ''}`,
        category,
        price: 10 + (seed % 48),
        discountPercentage: deterministicDiscount(seed, 8, 24),
        rating: 4 + (seed % 9) / 10,
        stock: deterministicStock(seed),
        brand: item.brands?.split(',')[0]?.trim() || 'Open Beauty Edit',
        thumbnail: images[0] ?? '',
        images,
        tags: ['women', 'beauty', query, ...(item.categories_tags ?? []).slice(0, 8)],
        gender: 'women',
        source: 'openbeauty',
        sourceId: item.code || title,
        sourceLabel: 'Open Beauty Facts',
        sizes: ['One Size'],
      }
    }).filter((product): product is Product => Boolean(product))
  }))

  return settled.flatMap((result) => result.status === 'fulfilled' ? result.value : [])
}

export const openBeautyProvider: ManagedProvider = {
  id: 'openbeauty',
  label: 'Open Beauty Facts',
  priority: 86,
  load: loadOpenBeautyFacts,
}
