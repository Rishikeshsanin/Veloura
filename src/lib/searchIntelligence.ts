import { categoryLabel } from '../data/catalog'
import type { Product } from '../types'

const GROUPS = [
  ['sneakers','trainers','sneaker','trainer'],
  ['handbag','handbags','purse','purses','bag','bags'],
  ['kurta','kurtas','kurti','kurtis'],
  ['tshirt','tshirts','tee','tees','t-shirt','t-shirts'],
  ['jeans','jean','denim'],
  ['perfume','perfumes','fragrance','fragrances','scent','scents'],
  ['makeup','cosmetics','cosmetic'],
  ['moisturizer','moisturiser','moisturizers','moisturisers'],
  ['jewellery','jewelry'],
  ['trousers','pants'],
  ['sandals','sliders','slides'],
  ['co-ord','coords','co-ords','matching set','matching sets'],
]

const aliasMap = new Map<string,string[]>()
for (const group of GROUPS) {
  for (const term of group) aliasMap.set(term, group.filter((item) => item !== term))
}

export function normalizeSearch(value: string) {
  return value
    .toLowerCase()
    .replace(/women'?s?/g,' ')
    .replace(/[^a-z0-9]+/g,' ')
    .replace(/\s+/g,' ')
    .trim()
}

function tokens(value: string) {
  return normalizeSearch(value).split(' ').filter(Boolean)
}

function editDistance(a: string, b: string) {
  if (a === b) return 0
  if (!a.length) return b.length
  if (!b.length) return a.length
  if (Math.abs(a.length - b.length) > 2) return 3
  const previous = Array.from({length:b.length+1},(_,i)=>i)
  for (let i=1;i<=a.length;i++) {
    let diagonal=previous[0]
    previous[0]=i
    for (let j=1;j<=b.length;j++) {
      const up=previous[j]
      previous[j]=Math.min(previous[j]+1,previous[j-1]+1,diagonal+(a[i-1]===b[j-1]?0:1))
      diagonal=up
    }
  }
  return previous[b.length]
}

function tokenScore(queryToken: string, candidateToken: string) {
  if (queryToken === candidateToken) return 14
  if (candidateToken.startsWith(queryToken) || queryToken.startsWith(candidateToken)) return 9
  if (queryToken.length >= 4 && candidateToken.length >= 4 && editDistance(queryToken,candidateToken) <= 1) return 6
  const aliases=aliasMap.get(queryToken) ?? []
  if (aliases.includes(candidateToken)) return 11
  return 0
}

function fieldScore(query: string, field: string, weight: number) {
  const q=normalizeSearch(query)
  const value=normalizeSearch(field)
  if(!q||!value)return 0
  let score=value===q?40:value.includes(q)?24:0
  const candidateTokens=tokens(value)
  for(const token of tokens(q)) {
    const best=candidateTokens.reduce((max,candidate)=>Math.max(max,tokenScore(token,candidate)),0)
    score+=best
  }
  return score*weight
}

export function productSearchScore(product: Product, query: string) {
  let score=0
  score+=fieldScore(query,product.title,4)
  score+=fieldScore(query,product.brand ?? '',2.8)
  score+=fieldScore(query,categoryLabel(product.category),2.1)
  score+=fieldScore(query,(product.tags ?? []).join(' '),1.5)
  score+=fieldScore(query,product.color ?? '',1.25)
  score+=fieldScore(query,product.occasion ?? '',1.25)
  if(product.stock===0)score-=5
  if(product.rating!==undefined)score+=Math.max(0,product.rating-4)*2
  return score
}

export function rankCatalogSearch(products: Product[], query: string, limit = 100) {
  const normalized=normalizeSearch(query)
  if(!normalized)return products.slice(0,limit)
  return products
    .map((product)=>({product,score:productSearchScore(product,normalized)}))
    .filter((entry)=>entry.score>=18)
    .sort((a,b)=>b.score-a.score)
    .slice(0,limit)
    .map((entry)=>entry.product)
}

export function expandSearchQueries(query: string) {
  const normalized=normalizeSearch(query)
  if(!normalized)return []
  const variants=new Set<string>([normalized])
  const queryTokens=tokens(normalized)
  queryTokens.forEach((token,index)=>{
    const aliases=aliasMap.get(token) ?? []
    aliases.slice(0,2).forEach((alias)=>{
      const next=[...queryTokens]
      next[index]=alias
      variants.add(next.join(' '))
    })
  })
  return [...variants].slice(0,4)
}

export function searchSuggestion(query: string, products: Product[]) {
  const normalized=normalizeSearch(query)
  if(!normalized)return null
  const qTokens=tokens(normalized)
  const vocabulary=new Map<string,number>()
  products.forEach((product)=>{
    tokens([product.title,product.brand,categoryLabel(product.category),...(product.tags ?? [])].filter(Boolean).join(' ')).forEach((token)=>{
      if(token.length>=3)vocabulary.set(token,(vocabulary.get(token)??0)+1)
    })
  })

  let changed=false
  const corrected=qTokens.map((token)=>{
    if(vocabulary.has(token)||aliasMap.has(token))return token
    let best=token
    let bestDistance=3
    let bestFrequency=0
    vocabulary.forEach((frequency,candidate)=>{
      if(Math.abs(candidate.length-token.length)>1)return
      const distance=editDistance(token,candidate)
      if(distance<bestDistance || (distance===bestDistance && frequency>bestFrequency)){
        best=candidate;bestDistance=distance;bestFrequency=frequency
      }
    })
    if(bestDistance<=1&&best!==token){changed=true;return best}
    return token
  })
  return changed?corrected.join(' '):null
}
