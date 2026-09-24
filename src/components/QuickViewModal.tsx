import { Heart, ShoppingBag, Star, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { formatINR, getProductPricing } from '../lib/money'
import { defaultProductSize, productSizes } from '../lib/sizing'
import { productImageMode } from '../lib/productIntelligence'
import { useShop } from '../store/ShopContext'

export default function QuickViewModal() {
  const { quickViewProduct: product, closeQuickView, addToCart, toggleWishlist, isWishlisted } = useShop()
  const [size, setSize] = useState('M')
  const [imageIndex, setImageIndex] = useState(0)

  const images = useMemo(() => product ? Array.from(new Set([...(product.images ?? []), product.thumbnail].filter(Boolean))).slice(0, 6) : [], [product])

  useEffect(() => {
    if (!product) return
    setSize(defaultProductSize(product))
    setImageIndex(0)
    document.body.classList.add('modal-open')
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') closeQuickView() }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.classList.remove('modal-open')
      window.removeEventListener('keydown', onKey)
    }
  }, [product, closeQuickView])

  if (!product) return null

  const pricing = getProductPricing(product)
  const wished = isWishlisted(product.id)
  const href = `/product/${product.id}?category=${encodeURIComponent(product.category)}`
  const imageMode = productImageMode(product)

  return <div className="quick-view-backdrop" onMouseDown={closeQuickView} role="presentation">
    <section className="quick-view-modal" role="dialog" aria-modal="true" aria-label={`Quick view ${product.title}`} onMouseDown={(event) => event.stopPropagation()}>
      <button className="quick-view-close" aria-label="Close quick view" onClick={closeQuickView}><X size={20}/></button>
      <div className="quick-view-gallery">
        <div className={`quick-view-main image-mode-${imageMode}`}><img src={images[imageIndex] || product.thumbnail} alt={product.title}/></div>
        {images.length > 1 && <div className="quick-view-thumbs">{images.map((src, index) => <button key={src} className={index === imageIndex ? 'active' : ''} onClick={() => setImageIndex(index)}><img src={src} alt=""/></button>)}</div>}
      </div>
      <div className="quick-view-copy">
        <span className="eyebrow">{product.brand || 'VELOURA EDIT'}</span>
        <h2>{product.title}</h2>
        {product.rating !== undefined && <div className="quick-view-rating"><Star size={14} fill="currentColor"/> {product.rating.toFixed(1)} <span>{product.reviews?.length ? `· ${product.reviews.length} written reviews` : '· Catalog rating'}</span></div>}
        <p>{product.description}</p>
        <div className="quick-view-price"><strong>{formatINR(pricing.selling)}</strong>{pricing.discount > 0 && <><s>{formatINR(pricing.mrp)}</s><span>{pricing.discount}% off</span></>}</div>
        <small className="tax-note">inclusive of all taxes</small>
        <div className="quick-view-size"><div><strong>Select size</strong><Link to={`${href}#size-guide`} onClick={closeQuickView}>Size guide</Link></div><div>{productSizes(product).map((value) => <button key={value} className={size === value ? 'active' : ''} onClick={() => setSize(value)}>{value}</button>)}</div></div>
        <div className="quick-view-actions"><button className="button primary" onClick={() => addToCart(product, size)}><ShoppingBag size={17}/> Add to bag</button><button className={`button outline ${wished ? 'active' : ''}`} onClick={() => toggleWishlist(product)}><Heart size={17} fill={wished ? 'currentColor' : 'none'}/>{wished ? 'Saved' : 'Wishlist'}</button></div>
        <Link className="quick-view-full" to={href} onClick={closeQuickView}>View full product details →</Link>
      </div>
    </section>
  </div>
}
