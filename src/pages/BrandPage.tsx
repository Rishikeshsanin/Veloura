import { ArrowLeft, ArrowRight, Sparkles } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import ProductCard from '../components/ProductCard'
import ProductSkeleton from '../components/ProductSkeleton'
import { categoryLabel } from '../data/catalog'
import { fetchCatalog, searchProducts } from '../lib/api'
import { scoreTrending } from '../lib/personalization'
import type { Product } from '../types'

export default function BrandPage() {
  const { brand: brandParam = '' } = useParams()
  const brand = decodeURIComponent(brandParam)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    ;(async () => {
      const [base, searched] = await Promise.all([
        fetchCatalog().catch(() => []),
        searchProducts(brand).catch(() => []),
      ])
      if (cancelled) return
      const wanted = brand.trim().toLowerCase()
      const seen = new Set<number>()
      const exact = [...base, ...searched].filter((product) => {
        if (seen.has(product.id)) return false
        const matches = product.brand?.trim().toLowerCase() === wanted
        if (matches) seen.add(product.id)
        return matches
      })
      setProducts(exact.sort((a, b) => scoreTrending(b) - scoreTrending(a)))
      setLoading(false)
    })()
    return () => { cancelled = true }
  }, [brand])

  const categories = useMemo(() => {
    const map = new Map<string, number>()
    products.forEach((product) => map.set(product.category, (map.get(product.category) ?? 0) + 1))
    return [...map.entries()].sort((a, b) => b[1] - a[1])
  }, [products])

  const hero = products.find((product) => product.images?.length) ?? products[0]

  return <div className="brand-page">
    <section className="brand-hero container-wide">
      <div className="brand-hero-copy">
        <Link className="brand-back" to="/shop"><ArrowLeft size={15}/> Back to women</Link>
        <span className="eyebrow">BRAND STORE</span>
        <h1>{brand}</h1>
        <p>{loading ? 'Curating this brand store…' : `${products.length.toLocaleString('en-IN')} styles currently available across Veloura’s women-only catalog.`}</p>
        <div className="brand-hero-meta"><span><Sparkles size={14}/> Quality-filtered catalog</span><span>Women only</span></div>
      </div>
      <div className="brand-hero-image">
        {hero ? <img src={hero.images?.[0] || hero.thumbnail} alt={brand} /> : <div className="brand-fallback"><strong>{brand.slice(0,1).toUpperCase()}</strong><span>VELOURA BRAND STORE</span></div>}
      </div>
    </section>

    {!loading && categories.length > 0 && <section className="brand-category-strip container-wide">
      <span>Explore {brand}</span>
      <div>{categories.map(([category, count]) => <Link key={category} to={`/shop?category=${encodeURIComponent(category)}&brand=${encodeURIComponent(brand)}`}>{categoryLabel(category)} <small>{count}</small></Link>)}</div>
    </section>}

    <section className="brand-catalog container-wide">
      <div className="section-heading simple-heading"><div><span className="eyebrow">THE {brand.toUpperCase()} EDIT</span><h2>{loading ? 'Loading the collection' : products.length ? 'Shop the collection' : 'No styles available right now'}</h2></div>{products.length > 0 && <Link to={`/shop?brand=${encodeURIComponent(brand)}`}>Open filters <ArrowRight size={15}/></Link>}</div>
      <div className="product-grid shop-grid">{loading ? Array.from({length:15}).map((_,index) => <ProductSkeleton key={index}/>) : products.slice(0,60).map((product) => <ProductCard key={product.id} product={product}/>)}</div>
      {!loading && products.length === 0 && <div className="empty-state"><span className="empty-mark">V</span><h2>This brand is between drops.</h2><p>Explore the wider Veloura women’s store while the catalog refreshes.</p><Link className="button outline" to="/shop">Shop all women</Link></div>}
    </section>
  </div>
}
