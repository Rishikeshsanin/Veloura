import { Eye, Heart, ImageOff, Plus, Star } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { categoryLabel } from '../data/catalog'
import { getProductPricing, formatINR } from '../lib/money'
import { useShop } from '../store/ShopContext'
import type { Product } from '../types'

function badgeFor(product: Product) {
  if ((product.rating ?? 0) >= 4.8) return 'BESTSELLER'
  if ((product.discountPercentage ?? 0) >= 45) return 'HOT DEAL'
  if (product.id % 4 === 0) return 'NEW'
  return ''
}

function normalizeImages(product: Product) {
  return Array.from(new Set([...(product.images ?? []), product.thumbnail].filter(Boolean)))
}

export default function ProductCard({ product, compact = false }: { product: Product; compact?: boolean }) {
  const { addToCart, toggleWishlist, isWishlisted, openQuickView } = useShop()
  const wished = isWishlisted(product.id)
  const { mrp, selling, discount } = getProductPricing(product)
  const imageCandidates = useMemo(() => normalizeImages(product), [product])
  const [imageIndex, setImageIndex] = useState(0)
  const [primaryReady, setPrimaryReady] = useState(false)
  const [secondaryFailed, setSecondaryFailed] = useState(false)
  const [secondaryReady, setSecondaryReady] = useState(false)
  const badge = badgeFor(product)
  const productHref = `/product/${product.id}?category=${encodeURIComponent(product.category)}`

  useEffect(() => {
    setImageIndex(0)
    setPrimaryReady(false)
    setSecondaryFailed(false)
    setSecondaryReady(false)
  }, [product.id])

  const primaryImage = imageCandidates[imageIndex]
  const secondaryImage = imageCandidates[imageIndex + 1]

  const primaryFailed = () => {
    setPrimaryReady(false)
    setImageIndex((current) => current + 1)
    setSecondaryFailed(false)
    setSecondaryReady(false)
  }

  return <article className={`product-card ${compact ? 'compact' : ''}`} data-category={product.category}>
    <div className="product-media">
      <Link className="product-image-link" to={productHref} aria-label={product.title}>
        {primaryImage ? <>
          <div className={`product-image-loading ${primaryReady ? 'hidden' : ''}`} aria-hidden="true"><strong>V</strong><span>VELOURA</span></div>
          <img className={`product-image primary-image ${primaryReady ? 'primary-ready' : ''} ${secondaryReady ? 'has-secondary' : ''}`} src={primaryImage} alt={product.title} loading="lazy" decoding="async" onLoad={() => setPrimaryReady(true)} onError={primaryFailed} />
          {secondaryImage && !secondaryFailed && <img className={`product-image secondary-image ${secondaryReady ? 'ready' : ''}`} src={secondaryImage} alt="" loading="lazy" decoding="async" onLoad={() => setSecondaryReady(true)} onError={() => { setSecondaryFailed(true); setSecondaryReady(false) }} />}
        </> : <div className="product-image-fallback"><ImageOff size={26} /><strong>VELOURA</strong><span>{categoryLabel(product.category)}</span></div>}
      </Link>
      <div className="product-badges">{badge && <span className="product-badge">{badge}</span>}{discount >= 30 && <span className="sale-pill">{discount}% OFF</span>}</div>
      <button className={`wish-button ${wished ? 'active' : ''}`} aria-label={wished ? 'Remove from wishlist' : 'Add to wishlist'} onClick={() => toggleWishlist(product)}><Heart size={18} strokeWidth={1.8} fill={wished ? 'currentColor' : 'none'} /></button>
      <div className="product-card-actions"><button className="quick-view" onClick={() => openQuickView(product)}><Eye size={15}/> Quick view</button><button className="quick-add" onClick={() => addToCart(product, product.sizes?.[0] || 'M')}><Plus size={15} /> Add</button></div>
    </div>
    <div className="product-copy">
      <div className="product-brand-row"><strong className="product-brand">{product.brand || 'Veloura Edit'}</strong><span className="rating"><Star size={12} fill="currentColor" /> {(product.rating ?? 4.5).toFixed(1)}</span></div>
      <Link className="product-title" to={productHref}>{product.title}</Link>
      <div className="price-line"><strong>{formatINR(selling)}</strong>{discount > 0 && <><s>{formatINR(mrp)}</s><span>({discount}% off)</span></>}</div>
      {product.stock !== undefined && product.stock <= 15 && <p className="stock-note">Only a few left</p>}
    </div>
  </article>
}
