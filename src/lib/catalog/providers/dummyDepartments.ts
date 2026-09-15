import type { Product } from '../../../types'
import { fetchProviderJson, sizesForCategory, uniqueExternalImages, type ManagedProvider } from './shared'

type DummyProduct = {
  id: number
  title: string
  description: string
  price: number
  discountPercentage?: number
  rating?: number
  stock?: number
  brand?: string
  thumbnail?: string
  images?: string[]
  tags?: string[]
}

type DummyPayload = { products?: DummyProduct[] }

const departments: Array<[string, string]> = [
  ['skin-care', 'womens-skincare'],
  ['womens-watches', 'womens-watches'],
  ['sunglasses', 'womens-sunglasses'],
  ['fragrances', 'womens-fragrance'],
]

async function loadDummyDepartments() {
  const settled = await Promise.allSettled(departments.map(async ([remote, category]) => {
    const payload = await fetchProviderJson<DummyPayload>(`https://dummyjson.com/products/category/${remote}?limit=100`)
    return (payload.products ?? []).map<Product>((item) => {
      const images = uniqueExternalImages([...(item.images ?? []), item.thumbnail])
      return {
        id: 610000 + item.id,
        title: item.title,
        description: item.description,
        category,
        price: item.price,
        discountPercentage: item.discountPercentage,
        rating: item.rating,
        stock: item.stock,
        brand: item.brand,
        thumbnail: images[0] ?? '',
        images,
        tags: ['women', category.replace('womens-', ''), ...(item.tags ?? [])],
        gender: 'women',
        source: 'dummyjson',
        sourceId: `${remote}-${item.id}`,
        sourceLabel: 'DummyJSON department feed',
        sizes: sizesForCategory(category),
      }
    })
  }))

  return settled.flatMap((result) => result.status === 'fulfilled' ? result.value : [])
}

export const dummyDepartmentsProvider: ManagedProvider = {
  id: 'dummy-departments',
  label: 'DummyJSON expanded departments',
  priority: 108,
  load: loadDummyDepartments,
}
