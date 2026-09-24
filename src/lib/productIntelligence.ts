import type { Product } from '../types'

const SIZE_OPTIONAL_CATEGORIES = new Set([
  'womens-bags','womens-jewellery','womens-watches','womens-sunglasses',
  'womens-accessories','womens-beauty','womens-skincare','womens-haircare','womens-fragrance',
])

const CONTAIN_CATEGORIES = new Set([
  'womens-shoes','womens-bags','womens-jewellery','womens-watches',
  'womens-sunglasses','womens-accessories','womens-beauty',
  'womens-skincare','womens-haircare','womens-fragrance',
])

const COLOR_MAP: Record<string,string> = {
  'navy':'#1f2a44','navy blue':'#1f2a44','cream':'#eee5d7','ivory':'#f4efe6',
  'beige':'#d9c7ac','tan':'#b78b65','camel':'#b78a60','brown':'#6f4e37',
  'chocolate':'#54382b','black':'#171515','white':'#f7f5f1','grey':'#8f8d8a',
  'gray':'#8f8d8a','silver':'#b7b7b7','gold':'#c7a456','rose gold':'#c58f84',
  'pink':'#d99aaa','blush':'#d8a7a6','rose':'#bb7381','red':'#b44343',
  'burgundy':'#6f2638','maroon':'#6d2635','purple':'#79537f','lavender':'#b6a2c8',
  'blue':'#5179a8','sky blue':'#91b9d8','green':'#5c8067','olive':'#77805c',
  'sage':'#9fac91','yellow':'#d8bc60','orange':'#c97843','peach':'#e6ad8e',
}

const STOP = new Set(['women','womens','woman','the','and','with','for','from','this','that','new','style','fashion','ladies'])

function words(value = '') {
  return value.toLowerCase().split(/[^a-z0-9]+/).filter((word) => word.length > 2 && !STOP.has(word))
}

function titleSimilarity(a: Product, b: Product) {
  const aa = new Set(words(a.title))
  const bb = new Set(words(b.title))
  if (!aa.size || !bb.size) return 0
  let common = 0
  aa.forEach((word) => { if (bb.has(word)) common += 1 })
  return common / Math.max(aa.size, bb.size)
}

export function productImageMode(product: Product) {
  return CONTAIN_CATEGORIES.has(product.category) ? 'contain' : 'cover'
}

export function colorSwatch(color?: string) {
  if (!color) return '#d9d2cc'
  const key = color.trim().toLowerCase()
  return COLOR_MAP[key] ?? (typeof CSS !== 'undefined' && CSS.supports('color', key) ? key : '#cfc6c0')
}

export function productMerchandisingScore(product: Product) {
  let score = 0
  score += Math.min(product.images?.length ?? 0, 6) * 2.5
  if (product.rating !== undefined) score += Math.max(0, product.rating - 3.5) * 6
  if (product.brand) score += 2
  if (product.color) score += 1.5
  if (product.sizes?.length) score += 1.5
  if (product.occasion) score += 1
  if (product.description?.trim().length > 50) score += 2
  if (product.stock === 0) score -= 20
  else if (product.stock !== undefined) score += 1
  return score
}

export function productConfidence(product: Product) {
  const checks = [
    Boolean(product.images?.length || product.thumbnail),
    Boolean(product.title?.trim()),
    Boolean(product.description?.trim()),
    product.price > 0,
    Boolean(product.brand),
    Boolean(product.color),
    Boolean(product.sizes?.length) || SIZE_OPTIONAL_CATEGORIES.has(product.category),
    product.rating !== undefined,
  ]
  const complete = checks.filter(Boolean).length
  return {
    complete,
    total: checks.length,
    label: complete >= 7 ? 'Rich product information' : complete >= 5 ? 'Good product information' : 'Core product information',
  }
}

export function discoverColorways(product: Product, catalog: Product[], limit = 7) {
  const baseColor = product.color?.trim().toLowerCase()
  return catalog
    .filter((candidate) => candidate.id !== product.id && candidate.category === product.category && candidate.stock !== 0)
    .map((candidate) => {
      let score = titleSimilarity(product, candidate) * 18
      if (product.brand && candidate.brand && product.brand.toLowerCase() === candidate.brand.toLowerCase()) score += 15
      const ratio = Math.min(product.price || 1, candidate.price || 1) / Math.max(product.price || 1, candidate.price || 1)
      score += ratio * 6
      if (candidate.color && candidate.color.trim().toLowerCase() !== baseColor) score += 8
      else if (!candidate.color || candidate.color.trim().toLowerCase() === baseColor) score -= 6
      score += productMerchandisingScore(candidate) * .25
      return { candidate, score }
    })
    .filter(({ candidate, score }) => Boolean(candidate.color) && score >= 13)
    .sort((a,b) => b.score - a.score)
    .filter(({ candidate }, index, array) => array.findIndex(({ candidate: other }) => other.color?.trim().toLowerCase() === candidate.color?.trim().toLowerCase()) === index)
    .slice(0, limit)
    .map(({ candidate }) => candidate)
}
