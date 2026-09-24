import { ArrowRight, Clock3, Search, Sparkles, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { WOMEN_CATEGORIES } from '../data/catalog'
import { fetchCatalog } from '../lib/api'
import { formatINR, getProductPricing } from '../lib/money'
import { rankCatalogSearch, searchSuggestion } from '../lib/searchIntelligence'
import type { Product } from '../types'

const TRENDING = ['party dresses', 'workwear', 'sarees', 'heels', 'handbags', 'lipstick', 'skincare', 'fragrance']

function readRecent() {
  try { return JSON.parse(localStorage.getItem('veloura_recent_searches') || '[]') as string[] } catch { return [] }
}

export default function SearchOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [catalog, setCatalog] = useState<Product[]>([])
  const [recent, setRecent] = useState<string[]>(readRecent)
  const [activeIndex,setActiveIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const resultRefs = useRef<Array<HTMLButtonElement | null>>([])

  useEffect(() => {
    if (!open) return
    void fetchCatalog().then(setCatalog).catch(() => setCatalog([]))
    document.body.classList.add('modal-open')
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.classList.remove('modal-open')
      window.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  const normalized = query.trim().toLowerCase()
  const productMatches = useMemo(() => normalized ? rankCatalogSearch(catalog, normalized, 7) : [], [catalog, normalized])
  const categoryMatches = useMemo(() => normalized ? WOMEN_CATEGORIES.filter((category) => rankCatalogSearch(catalog.filter((product)=>product.category===category.value), normalized, 1).length || `${category.label} ${category.blurb}`.toLowerCase().includes(normalized)).slice(0, 5) : [], [catalog, normalized])
  const correction = useMemo(() => normalized ? searchSuggestion(normalized,catalog) : null,[normalized,catalog])
  const brandMatches = useMemo(() => {
    if (!normalized) return []
    const brands = new Map<string, number>()
    catalog.forEach((product) => {
      const brand = product.brand?.trim()
      if (brand && brand.toLowerCase().includes(normalized)) brands.set(brand, (brands.get(brand) || 0) + 1)
    })
    return [...brands.entries()].sort((a,b) => b[1] - a[1]).slice(0, 5)
  }, [catalog, normalized])

  const go = (value: string) => {
    const next = value.trim()
    if (!next) return
    const updated = [next, ...recent.filter((item) => item.toLowerCase() !== next.toLowerCase())].slice(0, 6)
    setRecent(updated)
    localStorage.setItem('veloura_recent_searches', JSON.stringify(updated))
    navigate(`/shop?q=${encodeURIComponent(next)}`)
    setQuery('')
    onClose()
  }

  const resultCount = productMatches.length + categoryMatches.length + brandMatches.length
  useEffect(() => setActiveIndex(-1), [normalized])
  const moveActive = (direction: 1|-1) => {
    if (!resultCount) return
    setActiveIndex((current) => {
      const next = current < 0 ? (direction > 0 ? 0 : resultCount - 1) : (current + direction + resultCount) % resultCount
      queueMicrotask(() => resultRefs.current[next]?.focus())
      return next
    })
  }
  const submit = (event: FormEvent) => { event.preventDefault(); go(query) }
  if (!open) return null

  return <div className="search-overlay" onMouseDown={onClose}>
    <section className="search-overlay-panel" onMouseDown={(event) => event.stopPropagation()}>
      <div className="search-overlay-head"><form onSubmit={submit}><Search size={21}/><input ref={inputRef} autoFocus value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event)=>{if(event.key==='ArrowDown'){event.preventDefault();moveActive(1)}if(event.key==='ArrowUp'){event.preventDefault();moveActive(-1)}}} placeholder="Search dresses, brands, beauty, bags and more" aria-label="Search Veloura"/><button type="submit">Search</button></form><button className="search-overlay-close" onClick={onClose}><X size={20}/></button></div>
      {!normalized ? <div className="search-start-grid">
        <div><h3><Sparkles size={16}/> Trending now</h3><div className="search-chips">{TRENDING.map((item) => <button key={item} onClick={() => go(item)}>{item}</button>)}</div></div>
        <div><h3><Clock3 size={16}/> Recent searches</h3>{recent.length ? <div className="recent-searches">{recent.map((item) => <button key={item} onClick={() => go(item)}>{item}<ArrowRight size={14}/></button>)}</div> : <p className="search-muted">Your recent searches will appear here.</p>}</div>
        <div className="search-popular-categories"><h3>Popular departments</h3>{WOMEN_CATEGORIES.slice(0,8).map((category) => <button key={category.value} ref={(node)=>{resultRefs.current[productMatches.length+categoryMatches.indexOf(category)]=node}} onClick={() => { navigate(`/shop?category=${category.value}`); onClose() }}><img src={category.image} alt=""/><span><strong>{category.label}</strong><small>{category.blurb}</small></span></button>)}</div>
      </div> : <div className="search-results-grid">
        <div className="search-results-main">{correction && correction!==normalized && <div className="search-correction">Did you mean <button onClick={()=>go(correction)}>{correction}</button>?</div>}<div className="search-result-title"><span>Products</span>{productMatches.length > 0 && <button onClick={() => go(query)}>View all results <ArrowRight size={14}/></button>}</div>{productMatches.length ? productMatches.map((product) => { const price = getProductPricing(product); return <button className="search-product-result" key={product.id} ref={(node)=>{resultRefs.current[productMatches.indexOf(product)]=node}} onClick={() => { navigate(`/product/${product.id}?category=${product.category}`); onClose() }}><img src={product.thumbnail} alt=""/><span><b>{product.brand || 'Veloura Edit'}</b><strong>{product.title}</strong><small>{formatINR(price.selling)}</small></span></button> }) : <div className="search-empty-mini">No instant product matches. Press Enter to search the wider marketplace.</div>}</div>
        <aside>{categoryMatches.length > 0 && <div><h3>Departments</h3>{categoryMatches.map((category) => <button key={category.value} onClick={() => { navigate(`/shop?category=${category.value}`); onClose() }}>{category.label}<ArrowRight size={13}/></button>)}</div>}{brandMatches.length > 0 && <div><h3>Brands</h3>{brandMatches.map(([brand,count]) => <button key={brand} ref={(node)=>{resultRefs.current[productMatches.length+categoryMatches.length+brandMatches.findIndex(([value])=>value===brand)]=node}} onClick={() => { navigate(`/brand/${encodeURIComponent(brand)}`); onClose() }}>{brand}<small>{count} styles</small></button>)}</div>}</aside>
      </div>}
    </section>
  </div>
}
