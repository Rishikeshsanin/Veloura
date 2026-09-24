import type { Product } from '../types'

const ONE_SIZE_CATEGORIES = new Set([
  'womens-bags',
  'womens-jewellery',
  'womens-watches',
  'womens-sunglasses',
  'womens-accessories',
  'womens-beauty',
  'womens-skincare',
  'womens-haircare',
  'womens-fragrance',
])

export function productSizes(product: Product) {
  if (product.sizes?.length) return product.sizes
  if (ONE_SIZE_CATEGORIES.has(product.category)) return ['One Size']
  if (product.category === 'womens-shoes') return ['36','37','38','39','40','41']
  return ['XS','S','M','L','XL']
}

export function defaultProductSize(product: Product) {
  return productSizes(product)[0] || 'M'
}
