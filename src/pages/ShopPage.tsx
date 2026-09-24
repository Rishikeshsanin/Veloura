import { ChevronDown, SlidersHorizontal, Sparkles, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import ProductCard from '../components/ProductCard'
import ProductSkeleton from '../components/ProductSkeleton'
import { WOMEN_CATEGORIES, categoryLabel } from '../data/catalog'
import { fetchCatalog, fetchCategoryCatalog, searchProducts } from '../lib/api'
import { getProductPricing } from '../lib/money'
import type { Product } from '../types'

const PAGE_SIZE = 36
const sizeOrder = ['XS','S','M','L','XL','XXL','26','28','30','32','34','36','37','38','39','40','41','One Size']
const CATEGORY_EDITS: Record<string, Array<{label:string; query:string}>> = {
  'womens-dresses': [{label:'Mini',query:'mini dress'},{label:'Midi',query:'midi dress'},{label:'Maxi',query:'maxi dress'},{label:'Party',query:'party dress'},{label:'Work',query:'work dress'},{label:'Vacation',query:'vacation dress'}],
  'womens-tops': [{label:'Shirts',query:'women shirt'},{label:'Blouses',query:'women blouse'},{label:'Tees',query:'women tee'},{label:'Crop tops',query:'crop top'},{label:'Camisoles',query:'camisole'}],
  'womens-ethnicwear': [{label:'Sarees',query:'saree'},{label:'Kurtas',query:'kurta'},{label:'Anarkalis',query:'anarkali'},{label:'Lehengas',query:'lehenga'},{label:'Festive sets',query:'festive ethnic set'}],
  'womens-shoes': [{label:'Sneakers',query:'women sneakers'},{label:'Heels',query:'women heels'},{label:'Flats',query:'women flats'},{label:'Sandals',query:'women sandals'},{label:'Boots',query:'women boots'},{label:'Loafers',query:'women loafers'}],
  'womens-bags': [{label:'Totes',query:'tote bag'},{label:'Shoulder bags',query:'shoulder bag'},{label:'Crossbody',query:'crossbody bag'},{label:'Clutches',query:'clutch'},{label:'Mini bags',query:'mini bag'}],
  'womens-jewellery': [{label:'Earrings',query:'earrings'},{label:'Necklaces',query:'necklace'},{label:'Bracelets',query:'bracelet'},{label:'Rings',query:'ring'},{label:'Sets',query:'jewellery set'}],
  'womens-beauty': [{label:'Lip',query:'lipstick'},{label:'Base',query:'foundation'},{label:'Eyes',query:'mascara'},{label:'Cheeks',query:'blush'},{label:'Nails',query:'nail'}],
  'womens-skincare': [{label:'Cleansers',query:'cleanser'},{label:'Serums',query:'serum'},{label:'Moisturisers',query:'moisturizer'},{label:'SPF',query:'sunscreen'},{label:'Face care',query:'face care'}],
  'womens-haircare': [{label:'Shampoo',query:'shampoo'},{label:'Conditioner',query:'conditioner'},{label:'Hair oils',query:'hair oil'},{label:'Masks',query:'hair mask'}],
  'womens-fragrance': [{label:'Perfume',query:'perfume'},{label:'EDP',query:'eau de parfum'},{label:'Body mists',query:'body mist'},{label:'Fresh scents',query:'fresh fragrance'}],
  'womens-activewear': [{label:'Leggings',query:'women leggings'},{label:'Sports bras',query:'sports bra'},{label:'Training',query:'women training'},{label:'Yoga',query:'yoga set'}],
  'womens-denim': [{label:'Straight',query:'straight jeans'},{label:'Wide leg',query:'wide leg jeans'},{label:'Jackets',query:'denim jacket'},{label:'Skirts',query:'denim skirt'}],
  'womens-outerwear': [{label:'Blazers',query:'women blazer'},{label:'Jackets',query:'women jacket'},{label:'Trench',query:'women trench'},{label:'Coats',query:'women coat'}],
}

export default function ShopPage() {
  const [params, setParams] = useSearchParams()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [expanding, setExpanding] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [shown, setShown] = useState(PAGE_SIZE)

  const category = params.get('category') || ''
  const query = params.get('q') || ''
  const sort = params.get('sort') || 'featured'
  const max = Number(params.get('max') || 12000)
  const rating = Number(params.get('rating') || 0)
  const discount = Number(params.get('discount') || 0)
  const brand = params.get('brand') || ''
  const size = params.get('size') || ''
  const color = params.get('color') || ''
  const occasion = params.get('occasion') || ''
  const inStock = params.get('stock') === '1'
  const categoryEdits = CATEGORY_EDITS[category] ?? []

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setExpanding(false)

    if (query) {
      searchProducts(query).then((items) => {
        if (cancelled) return
        setProducts(items)
        setLoading(false)
      }).catch(() => {
        if (cancelled) return
        setProducts([])
        setLoading(false)
      })
      return () => { cancelled = true }
    }

    if (category) {
      fetchCatalog().then((base) => {
        if (cancelled) return
        setProducts(base.filter((product) => product.category === category))
        setLoading(false)
        setExpanding(true)
      }).catch(() => undefined)

      fetchCategoryCatalog(category).then((deep) => {
        if (cancelled) return
        setProducts(deep)
        setLoading(false)
        setExpanding(false)
      }).catch(() => {
        if (cancelled) return
        setLoading(false)
        setExpanding(false)
      })

      return () => { cancelled = true }
    }

    fetchCatalog().then((items) => {
      if (cancelled) return
      setProducts(items)
      setLoading(false)
    }).catch(() => {
      if (cancelled) return
      setProducts([])
      setLoading(false)
    })

    return () => { cancelled = true }
  }, [query, category])

  useEffect(() => setShown(PAGE_SIZE), [category, query, sort, max, rating, discount, brand, size, color, occasion, inStock])

  const facets = useMemo(() => {
    const brandCounts = new Map<string, number>()
    const sizeCounts = new Map<string, number>()
    const colorCounts = new Map<string, number>()
    const occasionCounts = new Map<string, number>()
    products.forEach((product) => {
      const label = product.brand?.trim()
      if (label) brandCounts.set(label, (brandCounts.get(label) || 0) + 1)
      ;(product.sizes ?? []).forEach((value) => sizeCounts.set(value, (sizeCounts.get(value) || 0) + 1))
      if (product.color?.trim()) colorCounts.set(product.color.trim(), (colorCounts.get(product.color.trim()) || 0) + 1)
      if (product.occasion?.trim()) occasionCounts.set(product.occasion.trim(), (occasionCounts.get(product.occasion.trim()) || 0) + 1)
    })
    const brands = [...brandCounts.entries()].sort((a,b) => b[1] - a[1]).slice(0,18)
    const sizes = [...sizeCounts.entries()].sort((a,b) => {
      const ai = sizeOrder.indexOf(a[0]); const bi = sizeOrder.indexOf(b[0])
      if (ai === -1 && bi === -1) return a[0].localeCompare(b[0])
      if (ai === -1) return 1
      if (bi === -1) return -1
      return ai - bi
    })
    const colors = [...colorCounts.entries()].sort((a,b) => b[1] - a[1]).slice(0,16)
    const occasions = [...occasionCounts.entries()].sort((a,b) => b[1] - a[1]).slice(0,12)
    return { brands, sizes, colors, occasions }
  }, [products])

  const visible = useMemo(() => {
    let items = [...products]
    if (category && query) items = items.filter((p) => p.category === category)
    items = items.filter((p) => getProductPricing(p).selling <= max)
    if (rating) items = items.filter((p) => (p.rating ?? 0) >= rating)
    if (discount) items = items.filter((p) => (p.discountPercentage ?? 0) >= discount)
    if (brand) items = items.filter((p) => p.brand === brand)
    if (size) items = items.filter((p) => (p.sizes ?? []).includes(size))
    if (color) items = items.filter((p) => p.color?.toLowerCase() === color.toLowerCase())
    if (occasion) items = items.filter((p) => p.occasion?.toLowerCase() === occasion.toLowerCase())
    if (inStock) items = items.filter((p) => p.stock === undefined || p.stock > 0)
    if (sort === 'price-low') items.sort((a,b) => getProductPricing(a).selling - getProductPricing(b).selling)
    if (sort === 'price-high') items.sort((a,b) => getProductPricing(b).selling - getProductPricing(a).selling)
    if (sort === 'rating') items.sort((a,b) => (b.rating ?? 0) - (a.rating ?? 0))
    if (sort === 'discount') items.sort((a,b) => (b.discountPercentage ?? 0) - (a.discountPercentage ?? 0))
    if (sort === 'new') items.sort((a,b) => b.id - a.id)
    return items
  }, [products, category, query, max, rating, discount, brand, size, color, occasion, inStock, sort])

  const update = (key: string, value: string) => {
    const next = new URLSearchParams(params)
    value ? next.set(key, value) : next.delete(key)
    setParams(next)
  }

  const clearFilters = () => {
    const next = new URLSearchParams()
    if (query) next.set('q', query)
    if (category) next.set('category', category)
    setParams(next)
  }

  const activeFilterCount = [max !== 12000, Boolean(rating), Boolean(discount), Boolean(brand), Boolean(size), Boolean(color), Boolean(occasion), inStock].filter(Boolean).length
  const shownCount = Math.min(shown, visible.length)
  const completion = visible.length ? Math.round((shownCount / visible.length) * 100) : 0

  return <div className="shop-page container-wide">
    <div className="breadcrumbs"><Link to="/">Home</Link><span>/</span><span>Women</span>{category && <><span>/</span><span>{categoryLabel(category)}</span></>}</div>
    <section className="shop-hero"><div><span className="eyebrow">WOMEN'S STORE</span><h1>{query ? `Search: “${query}”` : category ? categoryLabel(category) : 'Women’s fashion'}</h1><p>{category ? `Discover ${categoryLabel(category).toLowerCase()} across a deeper, quality-filtered Veloura collection.` : 'Dresses, tops, co-ords, ethnic wear, footwear, bags, jewellery, beauty and more—curated only for women.'}</p></div><div className="catalog-count"><strong>{loading ? '—' : visible.length}</strong><span>{expanding ? 'and growing' : 'styles'}</span></div></section>

    {categoryEdits.length > 0 && <section className="collection-edits"><div><span className="eyebrow">SHOP THE EDIT</span><strong>Explore {categoryLabel(category)}</strong></div><div className="collection-edit-chips">{categoryEdits.map((edit) => <Link key={edit.label} className={query.toLowerCase() === edit.query.toLowerCase() ? 'active' : ''} to={`/shop?category=${category}&q=${encodeURIComponent(edit.query)}`}>{edit.label}</Link>)}</div></section>}

    <div className="category-chip-row"><Link className={!category ? 'active' : ''} to="/shop">All women</Link>{WOMEN_CATEGORIES.map((item) => <Link className={category === item.value ? 'active' : ''} key={item.value} to={`/shop?category=${item.value}`}>{item.shortLabel || item.label}</Link>)}</div>

    <div className="quick-filter-row"><button className={activeFilterCount ? 'has-count' : ''} onClick={() => setFiltersOpen(true)}><SlidersHorizontal size={16}/> Filters{activeFilterCount > 0 && <b>{activeFilterCount}</b>}</button><button className={rating >= 4.5 ? 'active' : ''} onClick={() => update('rating', rating >= 4.5 ? '' : '4.5')}><Sparkles size={14}/> Top rated</button><button className={discount >= 40 ? 'active' : ''} onClick={() => update('discount', discount >= 40 ? '' : '40')}>40%+ off</button><button className={max === 999 ? 'active' : ''} onClick={() => update('max', max === 999 ? '' : '999')}>Under ₹999</button><button className={max === 1499 ? 'active' : ''} onClick={() => update('max', max === 1499 ? '' : '1499')}>Under ₹1,499</button>{brand && <button className="active filter-token" onClick={() => update('brand','')}>{brand}<X size={12}/></button>}{size && <button className="active filter-token" onClick={() => update('size','')}>Size {size}<X size={12}/></button>}{color && <button className="active filter-token" onClick={() => update('color','')}>{color}<X size={12}/></button>}{occasion && <button className="active filter-token" onClick={() => update('occasion','')}>{occasion}<X size={12}/></button>}{inStock && <button className="active filter-token" onClick={() => update('stock','')}>In stock<X size={12}/></button>}</div>

    <div className="shop-toolbar"><span aria-live="polite">{loading ? 'Loading women’s store…' : expanding ? `${visible.length} styles · adding more…` : `${visible.length} styles found`}</span><label>Sort by <select value={sort} onChange={(e) => update('sort', e.target.value)}><option value="featured">Recommended</option><option value="new">What’s new</option><option value="rating">Customer rating</option><option value="discount">Better discount</option><option value="price-low">Price: low to high</option><option value="price-high">Price: high to low</option></select><ChevronDown size={15}/></label>{expanding && <i className="catalog-progress" aria-hidden="true" />}</div>

    <div className="shop-layout">
      <aside className={`filters ${filtersOpen ? 'open' : ''}`}><div className="filter-head"><strong>FILTERS</strong><button className="text-link" onClick={clearFilters}>CLEAR FILTERS</button><button className="icon-button mobile-only" onClick={() => setFiltersOpen(false)}><X/></button></div>
        <div className="filter-block"><h3>Category</h3><label><input type="radio" checked={!category} onChange={() => update('category','')}/> All women</label>{WOMEN_CATEGORIES.map((item) => <label key={item.value}><input type="radio" checked={category === item.value} onChange={() => update('category', item.value)}/> {item.label}</label>)}</div>
        {facets.brands.length > 0 && <div className="filter-block filter-scroll"><h3>Brand</h3><label><input type="radio" checked={!brand} onChange={() => update('brand','')}/> All brands</label>{facets.brands.map(([label,count]) => <label key={label}><input type="radio" checked={brand === label} onChange={() => update('brand',label)}/><span>{label}</span><small>{count}</small></label>)}</div>}
        {facets.sizes.length > 0 && <div className="filter-block"><h3>Size</h3><div className="size-filter-grid">{facets.sizes.map(([value,count]) => <button key={value} className={size === value ? 'active' : ''} title={`${count} styles`} onClick={() => update('size', size === value ? '' : value)}>{value}</button>)}</div></div>}
        {facets.colors.length > 0 && <div className="filter-block"><h3>Colour</h3><div className="smart-filter-list">{facets.colors.map(([value,count]) => <button key={value} className={color === value ? 'active' : ''} onClick={() => update('color', color === value ? '' : value)}><i style={{backgroundColor:value}}/><span>{value}</span><small>{count}</small></button>)}</div></div>}
        {facets.occasions.length > 0 && <div className="filter-block"><h3>Occasion</h3><div className="smart-filter-list text-only">{facets.occasions.map(([value,count]) => <button key={value} className={occasion === value ? 'active' : ''} onClick={() => update('occasion', occasion === value ? '' : value)}><span>{value}</span><small>{count}</small></button>)}</div></div>}
        <div className="filter-block"><h3>Availability</h3><label><input type="checkbox" checked={inStock} onChange={() => update('stock', inStock ? '' : '1')}/> In-stock styles only</label></div>
        <div className="filter-block"><h3>Price</h3><input className="range" type="range" min="499" max="12000" step="250" value={Math.min(max,12000)} onChange={(e) => update('max', e.target.value === '12000' ? '' : e.target.value)}/><div className="range-label"><span>₹499</span><strong>₹{max.toLocaleString('en-IN')}</strong></div></div>
        <div className="filter-block"><h3>Discount</h3>{[20,30,40,50].map((value) => <label key={value}><input type="radio" checked={discount === value} onChange={() => update('discount', discount === value ? '' : String(value))}/> {value}% and above</label>)}</div>
        <div className="filter-block"><h3>Rating</h3>{[4.5,4,3.5].map((value) => <label key={value}><input type="radio" checked={rating === value} onChange={() => update('rating', rating === value ? '' : String(value))}/> {value} ★ & above</label>)}</div>
        <button className="button primary mobile-only full" onClick={() => setFiltersOpen(false)}>Show {visible.length} styles</button>
      </aside>
      {filtersOpen && <div className="filter-backdrop mobile-only" onClick={() => setFiltersOpen(false)}/>} 
      <section className="catalog-column" aria-busy={loading || expanding}>
        <div className="product-grid shop-grid catalog-grid-stage">{loading ? Array.from({length: 18}).map((_,i) => <ProductSkeleton key={i}/>) : visible.slice(0,shown).map((p) => <ProductCard key={p.id} product={p}/>)}</div>
        {!loading && visible.length === 0 && <div className="empty-state"><span className="empty-mark">V</span><h2>No styles matched</h2><p>Try clearing one filter or exploring another Veloura department.</p><button className="button outline" onClick={clearFilters}>Clear filters</button></div>}
        {shown < visible.length && <div className="load-more"><div className="load-more-meta"><span>Showing {shownCount.toLocaleString('en-IN')} of {visible.length.toLocaleString('en-IN')} styles</span><b>{completion}% explored</b></div><div className="load-more-track"><i style={{ width: `${completion}%` }} /></div><button className="button outline load-more-button" onClick={() => setShown((n) => n + PAGE_SIZE)}>View {Math.min(PAGE_SIZE, visible.length - shown).toLocaleString('en-IN')} more</button></div>}
      </section>
    </div>
  </div>
}
