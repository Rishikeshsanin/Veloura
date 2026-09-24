import { ArrowLeft, ArrowRight, Sparkles } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import ProductCard from '../components/ProductCard'
import ProductSkeleton from '../components/ProductSkeleton'
import { EDITORIAL_EDITS, getEditorialEdit } from '../data/edits'
import { fetchCatalog, searchProducts } from '../lib/api'
import { scoreTrending } from '../lib/personalization'
import type { Product } from '../types'

function dedupe(products: Product[]) {
  const seen = new Set<string>()
  return products.filter((product) => {
    const key = `${product.source ?? ''}:${product.sourceId ?? product.id}:${product.title.toLowerCase()}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export default function EditPage() {
  const { slug } = useParams()

  if (!slug) return <EditorialHub />
  return <EditorialCollection slug={slug} />
}

function EditorialHub() {
  return <div className="edits-page">
    <section className="edits-hub-hero container-wide">
      <span className="eyebrow">VELOURA EDITORIAL</span>
      <h1>What to wear,<br/>when you want a point of view.</h1>
      <p>Seasonal, occasion-led and mood-driven edits built on top of the live Veloura catalog.</p>
    </section>
    <section className="edit-card-grid container-wide">
      {EDITORIAL_EDITS.map((edit, index) => <Link className={`edit-story-card edit-story-${index % 3}`} key={edit.slug} to={`/edit/${edit.slug}`}>
        <img src={edit.hero} alt={edit.title} loading={index < 2 ? 'eager' : 'lazy'} />
        <div className="edit-story-shade" />
        <div><span>{edit.kicker}</span><h2>{edit.title}</h2><p>{edit.subtitle}</p><b>Open the edit <ArrowRight size={15}/></b></div>
      </Link>)}
    </section>
  </div>
}

function EditorialCollection({ slug }: { slug: string }) {
  const edit = getEditorialEdit(slug)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!edit) return
    let cancelled = false
    setLoading(true)
    ;(async () => {
      const base = await fetchCatalog().catch(() => [])
      const direct = base.filter((product) => edit.categories.includes(product.category))
      const searched = await Promise.all(edit.queries.slice(0,4).map((query) => searchProducts(query).catch(() => [])))
      if (cancelled) return
      const merged = dedupe([...direct, ...searched.flat()])
        .filter((product) => edit.categories.includes(product.category))
        .sort((a,b) => scoreTrending(b) - scoreTrending(a))
        .slice(0,96)
      setProducts(merged)
      setLoading(false)
    })()
    return () => { cancelled = true }
  }, [edit])

  const heroProducts = useMemo(() => products.slice(0,3), [products])

  if (!edit) return <div className="empty-state standalone"><h2>That edit has moved.</h2><p>Explore the current Veloura editorial desk.</p><Link className="button primary" to="/edits">View all edits</Link></div>

  return <div className="edit-detail-page">
    <section className="edit-detail-hero">
      <img src={edit.hero} alt={edit.title} />
      <div className="edit-detail-shade" />
      <div className="container-wide edit-detail-copy">
        <Link className="edit-back" to="/edits"><ArrowLeft size={15}/> All edits</Link>
        <span>{edit.kicker}</span>
        <h1>{edit.title}</h1>
        <p>{edit.subtitle}</p>
      </div>
    </section>

    <section className="edit-intro container-wide">
      <div><span className="eyebrow">THE POINT OF VIEW</span><h2>{edit.description}</h2></div>
      <div className="edit-intro-image"><img src={edit.portrait} alt="" loading="lazy"/></div>
      <div className="edit-intro-copy"><Sparkles size={18}/><p>This edit is assembled from the live Veloura catalog, then quality-ranked so stronger imagery, ratings, relevant categories and in-stock pieces rise first.</p><div className="edit-chip-row">{edit.chips.map((chip) => <Link key={chip.label} to={`/shop?q=${encodeURIComponent(chip.query)}`}>{chip.label}</Link>)}</div></div>
    </section>

    {!loading && heroProducts.length === 3 && <section className="edit-trio container-wide">
      {heroProducts.map((product,index) => <Link key={product.id} to={`/product/${product.id}?category=${encodeURIComponent(product.category)}`} className={`edit-trio-card trio-${index}`}>
        <img src={product.images?.[0] || product.thumbnail} alt={product.title} loading="lazy"/>
        <div><small>{product.brand || 'Veloura Edit'}</small><strong>{product.title}</strong><span>Discover <ArrowRight size={13}/></span></div>
      </Link>)}
    </section>}

    <section className="edit-shop container-wide">
      <div className="section-heading simple-heading"><div><span className="eyebrow">SHOP THE EDIT</span><h2>{loading ? 'Building the collection' : `${products.length} pieces, one point of view`}</h2><p>Use Quick View for a closer look or open any product for the full gallery, sizing and recommendations.</p></div></div>
      <div className="product-grid shop-grid">{loading ? Array.from({length:18}).map((_,index)=><ProductSkeleton key={index}/>) : products.map((product)=><ProductCard key={product.id} product={product}/>)}</div>
    </section>
  </div>
}
