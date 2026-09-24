import { Eye, Heart, ImageOff, Plus, Star } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { categoryLabel } from '../data/catalog'
import { getProductPricing, formatINR } from '../lib/money'
import { defaultProductSize } from '../lib/sizing'
import { productImageMode } from '../lib/productIntelligence'
import { useShop } from '../store/ShopContext'
import type { Product } from '../types'

function badgeFor(product: Product) {
  if (product.rating !== undefined && product.rating >= 4.8) return 'TOP RATED'
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
  const imageMode = productImageMode(product)
  const productHref = `/product/${product.id}?category=${encodeURIComponent(product.category)}`
  const soldOut = product.stock === 0

  useEffect(() => {
    setImageIndex(0)
    setPrimaryReady(false)
    setSecondaryFailed(false)
    setSecondaryReady(false)
  }, [product.id])

  const primaryImage = imageCandidates[imageIndex]
  const secondaryImage = imageCandidates[imageIndex + 1]

  const prefetchDetail = () => {
    void import('../pages/ProductPage')
    if (secondaryImage && typeof window !== 'undefined') { const preload = new Image(); preload.src = secondaryImage }
  }

  const primaryFailed = () => {
    setPrimaryReady(false)
    setImageIndex((current) => current + 1)
    setSecondaryFailed(false)
    setSecondaryReady(false)
  }

  return <article className={`product-card ${compact ? 'compact' : ''} image-mode-${imageMode}`} data-category={product.category} onMouseEnter={prefetchDetail} onFocus={prefetchDetail}>
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
      <div className="product-card-actions"><button className="quick-view" onClick={() => openQuickView(product)}><Eye size={15}/> Quick view</button><button className="quick-add" disabled={soldOut} onClick={() => !soldOut && addToCart(product, defaultProductSize(product))}>{soldOut ? 'Sold out' : <><Plus size={15} /> Add</>}</button></div>
    </div>
    <div className="product-copy">
      <div className="product-brand-row">{product.brand ? <Link className="product-brand brand-link" to={`/brand/${encodeURIComponent(product.brand)}`}>{product.brand}</Link> : <strong className="product-brand">Veloura Edit</strong>}{product.rating !== undefined && <span className="rating"><Star size={12} fill="currentColor" /> {product.rating.toFixed(1)}</span>}</div>
      <Link className="product-title" to={productHref}>{product.title}</Link>
      <div className="price-line"><strong>{formatINR(selling)}</strong>{discount > 0 && <><s>{formatINR(mrp)}</s><span>({discount}% off)</span></>}</div>
      {soldOut ? <p className="stock-note sold-out">Out of stock</p> : product.stock !== undefined && product.stock <= 15 && <p className="stock-note">Only a few left</p>}
    </div>
  </article>
}
