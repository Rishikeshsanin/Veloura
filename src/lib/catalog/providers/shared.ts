import type { Product } from '../../../types'

export const API_TIMEOUT = 8500

export async function runWithConcurrency<T>(tasks: Array<() => Promise<T>>, limit = 6): Promise<PromiseSettledResult<T>[]> {
  if (!tasks.length) return []
  const results: PromiseSettledResult<T>[] = new Array(tasks.length)
  let cursor = 0

  const worker = async () => {
    while (true) {
      const index = cursor
      cursor += 1
      if (index >= tasks.length) return
      try {
        results[index] = { status: 'fulfilled', value: await tasks[index]() }
      } catch (reason) {
        results[index] = { status: 'rejected', reason }
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(Math.max(1, limit), tasks.length) }, () => worker()))
  return results
}

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

async function request(url: string, init?: RequestInit): Promise<Response> {
  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), API_TIMEOUT)
  try {
    const response = await fetch(url, {
      ...init,
      signal: controller.signal,
      headers: { ...(init?.headers ?? {}) },
    })
    if (!response.ok) throw new Error(`${response.status} ${response.statusText}`)
    return response
  } finally {
    window.clearTimeout(timer)
  }
}

export async function fetchProviderJson<T>(url: string): Promise<T> {
  const response = await request(url, { headers: { Accept: 'application/json' } })
  return await response.json() as T
}

export async function fetchProviderText(url: string): Promise<string> {
  const response = await request(url, { headers: { Accept: 'text/plain,*/*' } })
  return await response.text()
}

export async function postProviderJson<T>(url: string, payload: unknown): Promise<T> {
  const response = await request(url, {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  return await response.json() as T
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

type CategoryRule = { include: RegExp; exclude?: RegExp }

const CATEGORY_RULES: Record<string, CategoryRule> = {
  'womens-dresses': { include: /\b(dress|gown|bodycon|slip dress|maxi dress|midi dress|mini dress)\b/i, exclude: /\b(dress shoes?|shoe|sandal|boot)\b/i },
  'womens-tops': { include: /\b(top|blouse|shirt|tee|t-shirt|tshirt|camisole|tank top|bodysuit)\b/i, exclude: /\b(top handle bag|handbag|tote|shoe|sandal)\b/i },
  'womens-coords': { include: /\b(co-?ord|coord|matching set|two[- ]piece|2[- ]piece|outfit set|skirt set|tracksuit|matching separates)\b/i },
  'womens-ethnicwear': { include: /\b(kurta|kurti|saree|sari|lehenga|salwar|anarkali|dupatta|ethnic|banarasi)\b/i },
  'womens-bottoms': { include: /\b(trouser|pants?|skirt|shorts?|palazzo|leggings?|culottes?|joggers?)\b/i },
  'womens-denim': { include: /\b(denim|jeans?|jean jacket|denim skirt|denim shorts?)\b/i },
  'womens-outerwear': { include: /\b(blazer|jacket|coat|trench|shacket|parka|bomber|outerwear)\b/i },
  'womens-activewear': { include: /\b(activewear|sports bra|gym|yoga|training|athletic|performance wear|workout|running tights?)\b/i },
  'womens-winterwear': { include: /\b(sweater|cardigan|hoodie|knitwear|pullover|fleece|winter coat|winter jacket)\b/i },
  'womens-swimwear': { include: /\b(swimwear|swimsuit|bikini|beachwear|one[- ]piece swimsuit|resort wear|tankini)\b/i },
  'womens-lingerie': { include: /\b(lingerie|bralette|bra|underwear|panty|panties|intimate|briefs?)\b/i },
  'womens-sleepwear': { include: /\b(sleepwear|nightwear|pajamas?|pyjamas?|loungewear|nightdress|robe|lounge set)\b/i },
  'womens-shoes': { include: /\b(shoes?|sneakers?|heels?|sandals?|boots?|loafers?|pumps?|mules?|flats?|ballerina|trainers?)\b/i },
  'womens-bags': { include: /\b(bag|handbag|purse|tote|clutch|crossbody|satchel|backpack|shoulder bag|mini bag)\b/i },
  'womens-jewellery': { include: /\b(earrings?|necklace|bracelet|ring|jewel(?:lery|ry)?|pendant|chain|anklet|brooch)\b/i },
  'womens-watches': {
    include: /\b(watch(?:es)?|wristwatch|smartwatch|timepiece|chronograph|g[- ]?shock|baby[- ]?g)\b/i,
    exclude: /\b(stopwatch|watch cap|cap|beanie|hat|gloves?|shirt|tee|t-shirt|short sleeve|sandal|shoe|sneaker|shorts?|pants?|trouser|jacket|hoodie|dress|top|bag|watch band|watch strap|watch case)\b/i,
  },
  'womens-sunglasses': { include: /\b(sunglasses?|eyewear|shades|cat[- ]eye glasses|aviator glasses|optical frames?)\b/i },
  'womens-accessories': { include: /\b(scarf|belt|cap|beanie|hat|hair clip|headband|wallet|gloves?|accessor(?:y|ies))\b/i },
  'womens-beauty': { include: /\b(lipstick|mascara|foundation|blush|makeup|cosmetic|nail polish|brow|concealer|eyeliner|lip gloss)\b/i },
  'womens-skincare': { include: /\b(skincare|skin care|cleanser|moisturizer|moisturiser|serum|sunscreen|toner|face cream|face wash|lotion)\b/i },
  'womens-haircare': { include: /\b(shampoo|conditioner|hair oil|hair mask|haircare|hair care|hair treatment|scalp|styling cream)\b/i },
  'womens-fragrance': { include: /\b(perfume|fragrance|eau de|body mist|parfum|eau de parfum|eau de toilette)\b/i },
}

export function matchesCategoryText(category: string, text: string) {
  const rule = CATEGORY_RULES[category]
  if (!rule) return true
  const value = text.toLowerCase()
  if (!rule.include.test(value)) return false
  if (rule.exclude?.test(value)) return false
  return true
}

const INFERENCE_ORDER = [
  'womens-dresses','womens-ethnicwear','womens-coords','womens-denim','womens-outerwear',
  'womens-winterwear','womens-activewear','womens-swimwear','womens-lingerie','womens-sleepwear',
  'womens-shoes','womens-bags','womens-jewellery','womens-sunglasses','womens-fragrance',
  'womens-haircare','womens-skincare','womens-beauty','womens-accessories','womens-watches',
  'womens-bottoms','womens-tops',
]

export function inferCategory(text: string, fallback = 'womens-tops') {
  for (const category of INFERENCE_ORDER) {
    if (matchesCategoryText(category, text)) return category
  }
  return fallback
}
