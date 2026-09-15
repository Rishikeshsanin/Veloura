import type { Product } from '../../../types'

export const API_TIMEOUT = 9000

export type ManagedProvider = {
  id: string
  label: string
  priority: number
  load: () => Promise<Product[]>
}

export function normalizeImageUrl(value?: string | null) {
  if (!value) return ''
  const trimmed = value.trim().replace(/^['"]|['"]$/g, '')
  if (!trimmed) return ''
  if (trimmed.startsWith('//')) return `https:${trimmed}`
  if (trimmed.startsWith('http://')) return trimmed.replace('http://', 'https://')
  return trimmed
}

export function isUsableExternalImage(value?: string | null) {
  const url = normalizeImageUrl(value)
  if (!/^https:\/\//i.test(url)) return false
  const blocked = ['placehold.co', 'placeholder.com', 'via.placeholder', 'placeimg.com', 'dummyjson.com/image/', 'lorem.space/image/']
  return !blocked.some((host) => url.includes(host))
}

export function uniqueExternalImages(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.map(normalizeImageUrl).filter(isUsableExternalImage)))
}

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), API_TIMEOUT)
  try {
    const response = await fetch(url, {
      ...init,
      signal: controller.signal,
      headers: { Accept: 'application/json', ...(init?.headers ?? {}) },
    })
    if (!response.ok) throw new Error(`${response.status} ${response.statusText}`)
    return await response.json() as T
  } finally {
    window.clearTimeout(timer)
  }
}

export function fetchProviderJson<T>(url: string): Promise<T> {
  return requestJson<T>(url)
}

export function postProviderJson<T>(url: string, payload: unknown): Promise<T> {
  return requestJson<T>(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

export function stableHash(value: string) {
  let hash = 2166136261
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return Math.abs(hash >>> 0)
}

export function stableNumericId(base: number, value: string | number) {
  return base + (stableHash(String(value)) % 99999)
}

export function deterministicDiscount(seed: number, min = 12, spread = 32) {
  return min + ((Math.abs(seed) * 11) % spread)
}

export function deterministicStock(seed: number) {
  return 7 + ((Math.abs(seed) * 17) % 46)
}

export function sizesForCategory(category: string) {
  if (category === 'womens-shoes') return ['36', '37', '38', '39', '40', '41']
  if (['womens-bags','womens-jewellery','womens-beauty','womens-skincare','womens-haircare','womens-fragrance','womens-watches','womens-sunglasses','womens-accessories'].includes(category)) return ['One Size']
  if (category === 'womens-lingerie') return ['XS', 'S', 'M', 'L', 'XL', 'XXL']
  return ['XS', 'S', 'M', 'L', 'XL']
}

export function inferCategory(text: string, fallback = 'womens-tops') {
  const value = text.toLowerCase()
  if (/dress|gown|maxi|midi|bodycon|slip dress/.test(value)) return 'womens-dresses'
  if (/kurta|kurti|saree|sari|lehenga|ethnic|salwar|anarkali/.test(value)) return 'womens-ethnicwear'
  if (/co-ord|coord|matching set|two piece|2 piece|skirt set/.test(value)) return 'womens-coords'
  if (/jean|denim/.test(value)) return 'womens-denim'
  if (/trouser|pant|skirt|short|palazzo|legging/.test(value)) return 'womens-bottoms'
  if (/blazer|jacket|coat|shacket|trench|parka|outerwear/.test(value)) return 'womens-outerwear'
  if (/cardigan|sweater|knit|hoodie|winter/.test(value)) return 'womens-winterwear'
  if (/sports bra|active|gym|athletic|yoga|training/.test(value)) return 'womens-activewear'
  if (/swim|bikini|beachwear|swimsuit|resort/.test(value)) return 'womens-swimwear'
  if (/lingerie|bralette|brief|intimate/.test(value)) return 'womens-lingerie'
  if (/sleep|pyjama|pajama|nightwear|lounge/.test(value)) return 'womens-sleepwear'
  if (/heel|sandal|shoe|pump|loafer|boot|sneaker|trainer|flat|mule|ballerina/.test(value)) return 'womens-shoes'
  if (/bag|purse|tote|clutch|handbag|crossbody|satchel/.test(value)) return 'womens-bags'
  if (/earring|necklace|bracelet|ring|jewel|pendant|chain|anklet/.test(value)) return 'womens-jewellery'
  if (/watch|timepiece/.test(value)) return 'womens-watches'
  if (/sunglass|eyewear|shades/.test(value)) return 'womens-sunglasses'
  if (/perfume|fragrance|eau de|body mist|parfum/.test(value)) return 'womens-fragrance'
  if (/shampoo|conditioner|hair oil|hair mask|haircare|hair care|styling/.test(value)) return 'womens-haircare'
  if (/skin care|skincare|cleanser|moisturi|serum|sunscreen|toner|face cream/.test(value)) return 'womens-skincare'
  if (/lip|mascara|foundation|blush|makeup|beauty|nail|brow|concealer|eyeliner|cosmetic/.test(value)) return 'womens-beauty'
  if (/belt|scarf|cap|hat|hair clip|accessor/.test(value)) return 'womens-accessories'
  return fallback
}
