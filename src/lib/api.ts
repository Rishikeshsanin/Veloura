import { fetchManagedCatalog, fetchManagedCategory, fetchManagedProduct, searchManagedCatalog } from './catalog/manager'
import { fetchSearchExpansion } from './catalog/searchExpansion'
import { expandSearchQueries, productSearchScore, rankCatalogSearch } from './searchIntelligence'

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
  const variants = expandSearchQueries(query)
  if (!variants.length) return []

  const baseCatalog = await fetchManagedCatalog().catch(() => [])
  const fuzzyLocal = rankCatalogSearch(baseCatalog, query, 120)
  const nativeGroups = await Promise.all(variants.map((variant) => searchManagedCatalog(variant).catch(() => [])))
  const local = [...fuzzyLocal, ...nativeGroups.flat()]

  const seen = new Set<string>()
  const dedupe = (products: typeof local) => products.filter((product) => {
    const key = `${(product.brand ?? '').toLowerCase()}::${product.title.toLowerCase().replace(/[^a-z0-9]+/g,' ')}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  const localRanked = dedupe(local).sort((a,b) => productSearchScore(b,query) - productSearchScore(a,query))
  if (localRanked.length >= 90) return localRanked.slice(0,300)

  const remoteGroups = await Promise.all(variants.slice(0,2).map((variant) => fetchSearchExpansion(variant).catch(() => [])))
  const merged = dedupe([...localRanked, ...remoteGroups.flat()])
  return merged.sort((a,b) => productSearchScore(b,query) - productSearchScore(a,query)).slice(0,300)
}

export { clearCatalogCache, getCatalogDiagnostics } from './catalog/manager'
