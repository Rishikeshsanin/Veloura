import { ChevronDown, SlidersHorizontal, Sparkles, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import ProductCard from '../components/ProductCard'
import { WOMEN_CATEGORIES, categoryLabel } from '../data/catalog'
import { fetchCatalog, searchProducts } from '../lib/api'
import { getProductPricing } from '../lib/money'
import type { Product } from '../types'

export default function ShopPage() {
  const [params, setParams] = useSearchParams()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [shown, setShown] = useState(24)

  const category = params.get('category') || ''
  const query = params.get('q') || ''
  const sort = params.get('sort') || 'featured'
  const max = Number(params.get('max') || 12000)
  const rating = Number(params.get('rating') || 0)
  const discount = Number(params.get('discount') || 0)

  useEffect(() => {
    setLoading(true)
    ;(query ? searchProducts(query) : fetchCatalog()).then((items) => {
      setProducts(items)
      setLoading(false)
    })
  }, [query])

  useEffect(() => setShown(24), [category, query, sort, max, rating, discount])

  const visible = useMemo(() => {
    let items = [...products]
    if (category) items = items.filter((p) => p.category === category)
    items = items.filter((p) => getProductPricing(p).selling <= max)
    if (rating) items = items.filter((p) => (p.rating ?? 0) >= rating)
    if (discount) items = items.filter((p) => (p.discountPercentage ?? 0) >= discount)
    if (sort === 'price-low') items.sort((a,b) => getProductPricing(a).selling - getProductPricing(b).selling)
    if (sort === 'price-high') items.sort((a,b) => getProductPricing(b).selling - getProductPricing(a).selling)
    if (sort === 'rating') items.sort((a,b) => (b.rating ?? 0) - (a.rating ?? 0))
    if (sort === 'discount') items.sort((a,b) => (b.discountPercentage ?? 0) - (a.discountPercentage ?? 0))
    if (sort === 'new') items.sort((a,b) => b.id - a.id)
    return items
  }, [products, category, max, rating, discount, sort])

  const update = (key: string, value: string) => {
    const next = new URLSearchParams(params)
    value ? next.set(key, value) : next.delete(key)
    setParams(next)
  }

  return <div className="shop-page container-wide">
    <div className="breadcrumbs"><Link to="/">Home</Link><span>/</span><span>Women</span>{category && <><span>/</span><span>{categoryLabel(category)}</span></>}</div>
    <section className="shop-hero"><div><span className="eyebrow">WOMEN'S STORE</span><h1>{query ? `Search: “${query}”` : category ? categoryLabel(category) : 'Women’s fashion'}</h1><p>Dresses, tops, co-ords, ethnic wear, footwear, bags, jewellery and beauty—curated only for women.</p></div><div className="catalog-count"><strong>{loading ? '—' : visible.length}</strong><span>styles</span></div></section>

    <div className="category-chip-row"><Link className={!category ? 'active' : ''} to="/shop">All women</Link>{WOMEN_CATEGORIES.map((item) => <Link className={category === item.value ? 'active' : ''} key={item.value} to={`/shop?category=${item.value}`}>{item.shortLabel || item.label}</Link>)}</div>

    <div className="quick-filter-row"><button onClick={() => setFiltersOpen(true)}><SlidersHorizontal size={16}/> Filters</button><button className={rating >= 4.5 ? 'active' : ''} onClick={() => update('rating', rating >= 4.5 ? '' : '4.5')}><Sparkles size={14}/> Top rated</button><button className={discount >= 40 ? 'active' : ''} onClick={() => update('discount', discount >= 40 ? '' : '40')}>40%+ off</button><button className={max === 999 ? 'active' : ''} onClick={() => update('max', max === 999 ? '' : '999')}>Under ₹999</button><button className={max === 1499 ? 'active' : ''} onClick={() => update('max', max === 1499 ? '' : '1499')}>Under ₹1,499</button></div>

    <div className="shop-toolbar"><span>{loading ? 'Loading women’s store…' : `${visible.length} styles found`}</span><label>Sort by <select value={sort} onChange={(e) => update('sort', e.target.value)}><option value="featured">Recommended</option><option value="new">What’s new</option><option value="rating">Customer rating</option><option value="discount">Better discount</option><option value="price-low">Price: low to high</option><option value="price-high">Price: high to low</option></select><ChevronDown size={15}/></label></div>

    <div className="shop-layout">
      <aside className={`filters ${filtersOpen ? 'open' : ''}`}><div className="filter-head"><strong>FILTERS</strong><button className="text-link" onClick={() => setParams(query ? {q: query} : {})}>CLEAR ALL</button><button className="icon-button mobile-only" onClick={() => setFiltersOpen(false)}><X/></button></div>
        <div className="filter-block"><h3>Category</h3><label><input type="radio" checked={!category} onChange={() => update('category','')}/> All women</label>{WOMEN_CATEGORIES.map((item) => <label key={item.value}><input type="radio" checked={category === item.value} onChange={() => update('category', item.value)}/> {item.label}</label>)}</div>
        <div className="filter-block"><h3>Price</h3><input className="range" type="range" min="499" max="12000" step="250" value={Math.min(max,12000)} onChange={(e) => update('max', e.target.value === '12000' ? '' : e.target.value)}/><div className="range-label"><span>₹499</span><strong>₹{max.toLocaleString('en-IN')}</strong></div></div>
        <div className="filter-block"><h3>Discount</h3>{[20,30,40,50].map((value) => <label key={value}><input type="radio" checked={discount === value} onChange={() => update('discount',String(value))}/> {value}% and above</label>)}</div>
        <div className="filter-block"><h3>Rating</h3>{[4.5,4,3.5].map((value) => <label key={value}><input type="radio" checked={rating === value} onChange={() => update('rating',String(value))}/> {value} ★ & above</label>)}</div>
        <button className="button primary mobile-only full" onClick={() => setFiltersOpen(false)}>Show {visible.length} styles</button>
      </aside>
      {filtersOpen && <div className="filter-backdrop mobile-only" onClick={() => setFiltersOpen(false)}/>} 
      <section className="catalog-column"><div className="product-grid shop-grid">{loading ? Array.from({length: 12}).map((_,i) => <div key={i} className="skeleton product-skeleton"/>) : visible.slice(0,shown).map((p) => <ProductCard key={p.id} product={p}/>)}</div>{!loading && visible.length === 0 && <div className="empty-state"><h2>No styles matched</h2><p>Clear a filter and keep exploring.</p></div>}{shown < visible.length && <div className="load-more"><span>Showing {Math.min(shown,visible.length)} of {visible.length}</span><button className="button outline" onClick={() => setShown((n) => n + 24)}>Load more</button></div>}</section>
    </div>
  </div>
}
