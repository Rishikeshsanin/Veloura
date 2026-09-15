import { fetchManagedCatalog, fetchManagedCategory, fetchManagedProduct, searchManagedCatalog } from './catalog/manager'
import { fetchSearchExpansion } from './catalog/searchExpansion'

export function fetchCatalog() {
  return fetchManagedCatalog()
}

export function fetchCategoryCatalog(category: string) {
  return fetchManagedCategory(category)
}

export function fetchProduct(id: string | number) {
  return fetchManagedProduct(id)
}

export async function searchProducts(query: string) {
  const local = await searchManagedCatalog(query)
  if (!query.trim() || local.length >= 90) return local

  const remote = await fetchSearchExpansion(query).catch(() => [])
  const seen = new Set<string>()
  const merged = [...local, ...remote].filter((product) => {
    const key = `${(product.brand ?? '').toLowerCase()}::${product.title.toLowerCase().replace(/[^a-z0-9]+/g,' ')}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
  return merged.slice(0,300)
}

export { clearCatalogCache, getCatalogDiagnostics } from './catalog/manager'
