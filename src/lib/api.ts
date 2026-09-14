import { fallbackProducts } from '../data/fallback'
import type { Product } from '../types'

const BASE = 'https://dummyjson.com/products'

const remoteCategories: Array<{ api: string; category: string }> = [
  { api: 'womens-dresses', category: 'womens-dresses' },
  { api: 'womens-bags', category: 'womens-bags' },
  { api: 'womens-shoes', category: 'womens-shoes' },
  { api: 'womens-jewellery', category: 'womens-jewellery' },
  { api: 'tops', category: 'womens-tops' },
  { api: 'beauty', category: 'womens-beauty' },
  { api: 'skin-care', category: 'womens-beauty' },
]

const allowedCategories = new Set(['womens-dresses','womens-bags','womens-shoes','womens-jewellery','womens-tops','womens-beauty','womens-coords','womens-ethnicwear','womens-activewear','womens-winterwear'])
const categoryMap: Record<string, string> = { 'womens-dresses':'womens-dresses','womens-bags':'womens-bags','womens-shoes':'womens-shoes','womens-jewellery':'womens-jewellery',tops:'womens-tops',beauty:'womens-beauty','skin-care':'womens-beauty' }

function normalizeRemote(product: Product, categoryOverride?: string): Product {
  const images = Array.isArray(product.images) && product.images.length ? product.images : [product.thumbnail]
  const category = categoryOverride ?? categoryMap[product.category] ?? product.category
  return { ...product, category, thumbnail: images[0] || product.thumbnail, images, gender: 'women', source: 'api', sizes: product.sizes?.length ? product.sizes : category === 'womens-shoes' ? ['36','37','38','39','40'] : ['XS','S','M','L','XL'] }
}

let catalogCache: Product[] | null = null
let pendingCatalog: Promise<Product[]> | null = null

export async function fetchCatalog(): Promise<Product[]> {
  if (catalogCache) return catalogCache
  if (pendingCatalog) return pendingCatalog
  pendingCatalog = (async () => {
    const results = await Promise.allSettled(remoteCategories.map(({ api, category }) => fetch(`${BASE}/category/${api}?limit=100`).then((response) => {
      if (!response.ok) throw new Error(`Catalog request failed: ${response.status}`)
      return response.json()
    }).then((payload) => (payload.products ?? []).map((product: Product) => normalizeRemote(product, category)))))
    const remote = results.flatMap((result) => result.status === 'fulfilled' ? result.value : [])
    const combined = [...remote, ...fallbackProducts]
    const deduped = Array.from(new Map(combined.map((product) => [product.id, product])).values()).filter((product) => allowedCategories.has(product.category))
    catalogCache = deduped
    return deduped
  })()
  try { return await pendingCatalog } catch { catalogCache = fallbackProducts; return fallbackProducts } finally { pendingCatalog = null }
}

export async function fetchProduct(id: string | number): Promise<Product | null> {
  const local = fallbackProducts.find((product) => product.id === Number(id))
  if (local) return local
  const cached = catalogCache?.find((product) => product.id === Number(id))
  if (cached) return cached
  try {
    const response = await fetch(`${BASE}/${id}`)
    if (!response.ok) throw new Error('Product not found')
    const normalized = normalizeRemote((await response.json()) as Product)
    return allowedCategories.has(normalized.category) ? normalized : null
  } catch { return null }
}

export async function searchProducts(query: string): Promise<Product[]> {
  const catalog = await fetchCatalog()
  const needle = query.trim().toLowerCase()
  if (!needle) return catalog
  return catalog.filter((product) => [product.title,product.description,product.brand,product.category,product.occasion,product.color,...(product.tags ?? [])].filter(Boolean).join(' ').toLowerCase().includes(needle))
}
