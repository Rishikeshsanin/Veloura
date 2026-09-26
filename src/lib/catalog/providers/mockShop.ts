import type { Product } from '../../../types'
import { inferCategory, postProviderJson, stableNumericId, uniqueExternalImages, type ManagedProvider } from './shared'

type MockShopProduct = {
  id: string
  title: string
  handle: string
  description?: string
  productType?: string
  vendor?: string
  featuredImage?: { url?: string } | null
  images?: { nodes?: Array<{ url?: string }> }
  priceRange?: { minVariantPrice?: { amount?: string; currencyCode?: string } }
  variants?: { nodes?: Array<{ availableForSale?: boolean }> }
}

type MockShopResponse = {
  data?: {
    products?: { nodes?: MockShopProduct[] }
  }
  errors?: Array<{ message?: string }>
}

const query = `
  query VelouraWomenCatalog {
    products(first: 100) {
      nodes {
        id
        title
        handle
        description
        productType
        vendor
        featuredImage { url }
        images(first: 10) { nodes { url } }
        priceRange { minVariantPrice { amount currencyCode } }
        variants(first: 1) { nodes { availableForSale } }
      }
    }
  }
`

async function loadMockShop() {
  const payload = await postProviderJson<MockShopResponse>('/catalog-source/mockshop', { query })
  if (payload.errors?.length) throw new Error(payload.errors.map((error) => error.message).filter(Boolean).join('; ') || 'mock.shop GraphQL error')

  return (payload.data?.products?.nodes ?? []).map<Product | null>((item) => {
    const text = `${item.title} ${item.productType ?? ''} ${item.description ?? ''}`
    if (/\bmen'?s\b|\bmens\b|\bmale\b/i.test(text)) return null
    const category = inferCategory(text, 'womens-tops')
    const images = uniqueExternalImages([item.featuredImage?.url, ...(item.images?.nodes ?? []).map((image) => image.url)])
    const amount = Number(item.priceRange?.minVariantPrice?.amount)
    if (!Number.isFinite(amount) || amount <= 0) return null
    const availableForSale = item.variants?.nodes?.[0]?.availableForSale

    return {
      id: stableNumericId(650000, item.id || item.handle || item.title),
      title: item.title,
      description: item.description?.trim() || `Women’s ${category.replace('womens-', '').replaceAll('-', ' ')} from Shopify’s apparel mock catalog.`,
      category,
      price: amount,
      stock: availableForSale === false ? 0 : undefined,
      brand: item.vendor?.trim() || undefined,
      thumbnail: images[0] ?? '',
      images,
      tags: ['women', 'shopify', 'apparel', item.productType ?? 'fashion'].filter(Boolean),
      gender: 'women',
      source: 'mockshop',
      sourceId: item.id || item.handle,
      sourceLabel: 'Shopify mock.shop · Elysian Thread',
    }
  }).filter((product): product is Product => Boolean(product))
}

export const mockShopProvider: ManagedProvider = {
  id: 'mockshop',
  label: 'Shopify mock.shop · women apparel',
  priority: 112,
  load: loadMockShop,
}
