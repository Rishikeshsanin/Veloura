import type { Product } from '../types'

const COMPLEMENTS: Record<string, string[]> = {
  'womens-dresses': ['womens-shoes','womens-bags','womens-jewellery'],
  'womens-tops': ['womens-bottoms','womens-denim','womens-bags'],
  'womens-coords': ['womens-shoes','womens-bags','womens-jewellery'],
  'womens-ethnicwear': ['womens-jewellery','womens-bags','womens-shoes'],
  'womens-bottoms': ['womens-tops','womens-shoes','womens-bags'],
  'womens-denim': ['womens-tops','womens-shoes','womens-bags'],
  'womens-outerwear': ['womens-tops','womens-bottoms','womens-bags'],
  'womens-activewear': ['womens-shoes','womens-accessories','womens-bags'],
  'womens-winterwear': ['womens-denim','womens-shoes','womens-accessories'],
  'womens-swimwear': ['womens-sunglasses','womens-bags','womens-accessories'],
  'womens-lingerie': ['womens-sleepwear','womens-beauty'],
  'womens-sleepwear': ['womens-beauty','womens-skincare'],
  'womens-shoes': ['womens-dresses','womens-bottoms','womens-bags'],
  'womens-bags': ['womens-dresses','womens-shoes','womens-jewellery'],
  'womens-jewellery': ['womens-dresses','womens-ethnicwear','womens-bags'],
  'womens-watches': ['womens-bags','womens-jewellery','womens-accessories'],
  'womens-sunglasses': ['womens-bags','womens-dresses','womens-accessories'],
  'womens-accessories': ['womens-bags','womens-jewellery','womens-dresses'],
  'womens-beauty': ['womens-skincare','womens-fragrance','womens-haircare'],
  'womens-skincare': ['womens-beauty','womens-haircare','womens-fragrance'],
  'womens-haircare': ['womens-beauty','womens-skincare','womens-fragrance'],
  'womens-fragrance': ['womens-beauty','womens-skincare','womens-accessories'],
}

function priceRatio(a: Product, b: Product) {
  const high = Math.max(a.price || 1, b.price || 1)
  const low = Math.min(a.price || 1, b.price || 1)
  return low / high
}

function tokens(product: Product) {
  return new Set([product.title, product.brand, product.color, product.occasion, ...(product.tags ?? [])]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((value) => value.length > 2))
}

export function similarProducts(product: Product, catalog: Product[], limit = 16) {
  const seed = tokens(product)
  return catalog.filter((item) => item.id !== product.id && item.category === product.category).map((item) => {
    let score = (item.rating ?? 0) * 3 + priceRatio(product, item) * 10
    if (item.brand && product.brand && item.brand === product.brand) score += 12
    if (item.color && product.color && item.color.toLowerCase() === product.color.toLowerCase()) score += 8
    tokens(item).forEach((token) => { if (seed.has(token)) score += 1.5 })
    return { item, score }
  }).sort((a,b) => b.score - a.score).slice(0,limit).map(({item}) => item)
}

export function completeTheLook(product: Product, catalog: Product[], limit = 12) {
  const categories = COMPLEMENTS[product.category] ?? []
  return catalog.filter((item) => item.id !== product.id && categories.includes(item.category)).map((item) => {
    const position = categories.indexOf(item.category)
    const score = (20 - position * 3) + (item.rating ?? 0) * 2 + Math.min(item.images?.length ?? 0, 5)
    return { item, score }
  }).sort((a,b) => b.score - a.score).slice(0,limit).map(({item}) => item)
}
