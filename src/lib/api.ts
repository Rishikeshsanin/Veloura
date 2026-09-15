import { fetchManagedCatalog, fetchManagedProduct, searchManagedCatalog } from './catalog/manager'

export function fetchCatalog() {
  return fetchManagedCatalog()
}

export function fetchProduct(id: string | number) {
  return fetchManagedProduct(id)
}

export function searchProducts(query: string) {
  return searchManagedCatalog(query)
}

export { clearCatalogCache, getCatalogDiagnostics } from './catalog/manager'
