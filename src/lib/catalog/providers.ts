import type { Product } from '../../types'

export type ProviderId = 'dummyjson' | 'fakestore' | 'platzi' | 'makeup'

export type CatalogProvider = {
  id: ProviderId
  label: string
  priority: number
  load: () => Promise<Product[]>
}

const API_TIMEOUT = 7000

export function normalizeImageUrl(value?: string | null) {
  if (!value) return ''
  const trimmed = value.trim()
  if (!trimmed) return ''
  if (trimmed.startsWith('//')) return `https:${trimmed}`
  if (trimmed.startsWith('http://')) return trimmed.replace('http://', 'https://')
  return trimmed
}

export function isUsableImage(value?: string | null) {
  const url = normalizeImageUrl(value)
  if (!/^https:\/\//i.test(url)) return false
  const blocked = ['placehold.co', 'placeholder.com', 'via.placeholder', 'placeimg.com', 'dummyjson.com/image/']
  return !blocked.some((host) => url.includes(host))
}

function uniqueImages(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.map(normalizeImageUrl).filter(isUsableImage)))
}

async function fetchJson<T>(url: string): Promise<T> {
  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), API_TIMEOUT)
  try {
    const response = await fetch(url, { signal: controller.signal })
    if (!response.ok) throw new Error(`${response.status} ${response.statusText}`)
    return await response.json() as T
  } finally {
    window.clearTimeout(timer)
  }
}

function titleCase(value?: string | null) {
  if (!value) return undefined
  return value.split(/[\s_-]+/).filter(Boolean).map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ')
}

function inferWomenCategory(text: string, fallback = 'womens-tops') {
  const value = text.toLowerCase()
  if (/dress|gown|maxi|midi|mini dress/.test(value)) return 'womens-dresses'
  if (/heel|sandal|shoe|pump|loafer|boot|sneaker/.test(value)) return 'womens-shoes'
  if (/bag|purse|tote|clutch|handbag|crossbody/.test(value)) return 'womens-bags'
  if (/earring|necklace|bracelet|ring|jewel|pendant|chain/.test(value)) return 'womens-jewellery'
  if (/lip|mascara|foundation|blush|makeup|beauty|nail|brow|concealer|eyeliner/.test(value)) return 'womens-beauty'
  if (/legging|sports bra|active|gym|athletic|yoga/.test(value)) return 'womens-activewear'
  if (/cardigan|sweater|jacket|coat|hoodie|winter/.test(value)) return 'womens-winterwear'
  if (/kurta|kurti|saree|lehenga|ethnic|salwar/.test(value)) return 'womens-ethnicwear'
  if (/co-ord|coord|matching set|two piece|2 piece/.test(value)) return 'womens-coords'
  return fallback
}

type DummyProduct = {
  id: number
  title: string
  description: string
  category: string
  price: number
  discountPercentage?: number
  rating?: number
  stock?: number
  brand?: string
  sku?: string
  thumbnail?: string
  images?: string[]
  tags?: string[]
  reviews?: Product['reviews']
}

type DummyPayload = { products?: DummyProduct[] }

const dummyCategories: Array<[string, string]> = [
  ['womens-dresses', 'womens-dresses'],
  ['womens-bags', 'womens-bags'],
  ['womens-shoes', 'womens-shoes'],
  ['womens-jewellery', 'womens-jewellery'],
  ['tops', 'womens-tops'],
  ['beauty', 'womens-beauty'],
  ['skin-care', 'womens-beauty'],
  ['womens-watches', 'womens-jewellery'],
]

async function loadDummyJson() {
  const settled = await Promise.allSettled(dummyCategories.map(async ([remote, category]) => {
    const payload = await fetchJson<DummyPayload>(`https://dummyjson.com/products/category/${remote}?limit=100`)
    return (payload.products ?? []).map<Product>((item) => {
      const images = uniqueImages([...(item.images ?? []), item.thumbnail])
      return {
        id: 100000 + item.id,
        title: item.title,
        description: item.description,
        category,
        price: item.price,
        discountPercentage: item.discountPercentage,
        rating: item.rating,
        stock: item.stock,
        brand: item.brand,
        sku: item.sku,
        thumbnail: images[0] ?? '',
        images,
        tags: item.tags,
        reviews: item.reviews,
        gender: 'women',
        source: 'dummyjson',
        sourceId: String(item.id),
      }
    })
  }))
  return settled.flatMap((result) => result.status === 'fulfilled' ? result.value : [])
}

type FakeStoreProduct = {
  id: number
  title: string
  price: number
  description: string
  category: string
  image: string
  rating?: { rate?: number; count?: number }
}

async function loadFakeStore() {
  const payload = await fetchJson<FakeStoreProduct[]>('https://fakestoreapi.com/products')
  return payload
    .filter((item) => item.category === "women's clothing" || item.category === 'jewelery')
    .map<Product>((item) => {
      const category = item.category === 'jewelery' ? 'womens-jewellery' : inferWomenCategory(`${item.title} ${item.description}`)
      const images = uniqueImages([item.image])
      return {
        id: 200000 + item.id,
        title: item.title,
        description: item.description,
        category,
        price: item.price,
        rating: item.rating?.rate,
        thumbnail: images[0] ?? '',
        images,
        tags: ['women', item.category],
        gender: 'women',
        source: 'fakestore',
        sourceId: String(item.id),
      }
    })
}

type PlatziProduct = {
  id: number
  title: string
  price: number
  description: string
  images?: string[]
  category?: { id?: number; name?: string; slug?: string }
}

const womenSignals = /\b(women|woman|ladies|female|dress|skirt|blouse|crop top|camisole|heel|handbag|purse|earring|necklace|bracelet|high-waisted|makeup)\b/i
const menSignals = /\b(men'?s|mens|male|boy)\b/i

async function loadPlatzi() {
  const payload = await fetchJson<PlatziProduct[]>('https://api.escuelajs.co/api/v1/products?offset=0&limit=120')
  return payload
    .filter((item) => {
      const text = `${item.title} ${item.description} ${item.category?.name ?? ''}`
      return womenSignals.test(text) && !menSignals.test(text)
    })
    .map<Product>((item) => {
      const text = `${item.title} ${item.description} ${item.category?.name ?? ''}`
      const category = inferWomenCategory(text)
      const images = uniqueImages(item.images ?? [])
      return {
        id: 300000 + item.id,
        title: item.title,
        description: item.description,
        category,
        price: item.price,
        thumbnail: images[0] ?? '',
        images,
        tags: ['women', item.category?.slug ?? 'fashion'],
        gender: 'women',
        source: 'platzi',
        sourceId: String(item.id),
      }
    })
}

type MakeupProduct = {
  id: number
  brand?: string | null
  name?: string | null
  price?: string | null
  image_link?: string | null
  api_featured_image?: string | null
  description?: string | null
  rating?: number | null
  category?: string | null
  product_type?: string | null
  tag_list?: string[]
}

async function loadMakeup() {
  const types = ['lipstick', 'mascara', 'blush', 'foundation', 'eyebrow', 'nail_polish']
  const settled = await Promise.allSettled(types.map((type) => fetchJson<MakeupProduct[]>(`https://makeup-api.herokuapp.com/api/v1/products.json?product_type=${type}`)))
  const raw = settled.flatMap((result) => result.status === 'fulfilled' ? result.value : [])
  const byId = Array.from(new Map(raw.map((item) => [item.id, item])).values())
  return byId.slice(0, 90).map<Product | null>((item) => {
    const images = uniqueImages([item.image_link, item.api_featured_image])
    const parsedPrice = Number.parseFloat(item.price ?? '')
    if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) return null
    return {
      id: 400000 + item.id,
      title: item.name || `${titleCase(item.product_type) || 'Beauty'} Essential`,
      description: item.description?.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() || 'A women’s beauty favourite selected for the Veloura beauty edit.',
      category: 'womens-beauty',
      price: parsedPrice,
      rating: typeof item.rating === 'number' && Number.isFinite(item.rating) ? item.rating : undefined,
      brand: titleCase(item.brand),
      thumbnail: images[0] ?? '',
      images,
      tags: ['women', 'beauty', item.product_type ?? '', ...(item.tag_list ?? [])].filter(Boolean),
      gender: 'women',
      source: 'makeup',
      sourceId: String(item.id),
    }
  }).filter((product): product is Product => Boolean(product))
}

export const catalogProviders: CatalogProvider[] = [
  { id: 'dummyjson', label: 'DummyJSON', priority: 100, load: loadDummyJson },
  { id: 'fakestore', label: 'Fake Store API', priority: 80, load: loadFakeStore },
  { id: 'platzi', label: 'Platzi Store API', priority: 70, load: loadPlatzi },
  { id: 'makeup', label: 'Makeup API', priority: 65, load: loadMakeup },
]
