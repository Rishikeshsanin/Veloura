import type { Product } from '../types'

export function productSizes(product: Product) {
  return product.sizes?.map((size) => size.trim()).filter(Boolean) ?? []
}

export function defaultProductSize(product: Product) {
  return productSizes(product)[0] || 'Not specified'
}
