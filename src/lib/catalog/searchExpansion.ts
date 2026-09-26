import type { Product } from '../../types'
import { fetchVaanzariEthnic } from './providers/vaanzari'
import {
  fetchProviderJson,
  inferCategory,
  matchesCategoryText,
  stableNumericId,
  uniqueExternalImages,
} from './providers/shared'

type LooseObject = Record<string, unknown>
type SoleScoutPayload = { results?: LooseObject[] }

const cache = new Map<string, { expires: number; products: Product[] }>()
const TTL = 20 * 60 * 1000

function isRecord(value: unknown): value is LooseObject { return Boolean(value) && typeof value === 'object' && !Array.isArray(value) }
function pickString(item: LooseObject, keys:string[]) { for (const key of keys) { const value=item[key]; if (typeof value === 'string' && value.trim()) return value.trim() } return '' }
function pickNumber(item: LooseObject, keys:string[]) { for (const key of keys) { const value=item[key]; const parsed=typeof value === 'number' ? value : typeof value === 'string' ? Number(value.replace(/[^0-9.]/g,'')) : Number.NaN; if (Number.isFinite(parsed) && parsed > 0) return parsed } return undefined }
function collectImages(item: LooseObject) {
  const values:string[]=[]
  for (const key of ['image','image_url','imageUrl','thumbnail','thumbnail_url','photo','cover','picture']) { const value=item[key]; if (typeof value === 'string') values.push(value) }
  if (Array.isArray(item.images)) item.images.forEach((entry) => { if (typeof entry === 'string') values.push(entry); if (isRecord(entry)) { const url=pickString(entry,['url','src','image_url','imageUrl','thumbnail_url']); if (url) values.push(url) } })
  return uniqueExternalImages(values)
}
function evidence(item:LooseObject,title:string) { return [title,pickString(item,['category','categories','type','product_type','productType','description','department','style','model']),pickString(item,['brand','brand_name','manufacturer'])].filter(Boolean).join(' ') }

function normalize(item: LooseObject, originalQuery:string): Product | null {
  const title=pickString(item,['title','name','product_name','model'])
  const itemGender=pickString(item,['gender','sex'])
  if (!title || /\bmen'?s\b|\bmens\b|\bmale\b|\bboy\b/i.test(title) || (itemGender && /men|male|boy/i.test(itemGender) && !/women|female/i.test(itemGender))) return null

  const productEvidence=evidence(item,title)
  const requestedCategory=inferCategory(originalQuery,'')
  if (requestedCategory && !matchesCategoryText(requestedCategory,productEvidence)) return null
  const category=inferCategory(productEvidence,'womens-tops')
  const slug=pickString(item,['slug','style_code','sku']) || title
  const images=collectImages(item)
  if (!images.length) return null
  const current=pickNumber(item,['lowest_price_usd','price_usd','lowest_price','price','current_price'])
  const retail=pickNumber(item,['retail_price_usd','retail_price','msrp','original_price'])
  const price=retail ?? current
  if (!price) return null
  const discount=retail && current && retail > current ? Math.round((1-current/retail)*100) : undefined

  return { id:stableNumericId(840000,slug), title, description:`Women’s ${category.replace('womens-','').replaceAll('-',' ')} style discovered for “${originalQuery}”.`, category, price, discountPercentage:discount, brand:pickString(item,['brand','brand_name','manufacturer']) || undefined, sku:pickString(item,['style_code','sku']) || undefined, thumbnail:images[0], images, tags:['women','search',originalQuery], gender:'women', source:'solescout', sourceId:slug, sourceUrl:pickString(item,['url','product_url']) || `https://solescout.ai/search?q=${encodeURIComponent(title)}`, sourceLabel:'SoleScout search network', color:pickString(item,['color','colour']) || undefined }
}

export async function fetchSearchExpansion(query:string) {
  const needle=query.trim().toLowerCase()
  if (!needle) return []
  const cached=cache.get(needle)
  if (cached && cached.expires > Date.now()) return cached.products
  const remoteQuery=/\bwomen|woman|ladies|female\b/i.test(query) ? query : `women ${query}`
  const settled=await Promise.allSettled([1,2,3,4].map(async (page) => {
    const payload=await fetchProviderJson<SoleScoutPayload>(`/catalog-source/solescout?q=${encodeURIComponent(remoteQuery)}&page=${page}&limit=25`)
    return (payload.results ?? []).map((item) => normalize(item,query)).filter((product): product is Product => Boolean(product))
  }))
  let products=settled.flatMap((result) => result.status === 'fulfilled' ? result.value : [])
  if (/saree|sari|banarasi|ethnic|silk/i.test(query)) products=[...await fetchVaanzariEthnic().catch(()=>[]),...products]

  const seen=new Set<string>(); const seenImages=new Set<string>()
  const unique=products.filter((product) => {
    const key=`${(product.brand ?? '').toLowerCase()}::${product.title.toLowerCase().replace(/[^a-z0-9]+/g,' ')}`
    if (seen.has(key) || seenImages.has(product.thumbnail)) return false
    seen.add(key); seenImages.add(product.thumbnail); return true
  }).slice(0,240)
  cache.set(needle,{expires:Date.now()+TTL,products:unique})
  return unique
}

export function clearSearchExpansionCache(){ cache.clear() }
