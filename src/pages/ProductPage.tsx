import { Heart, ImageOff, MapPin, Minus, Plus, ShieldCheck, Star, Truck } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import ProductRail from '../components/ProductRail'
import { categoryLabel } from '../data/catalog'
import { fetchCatalog, fetchProduct } from '../lib/api'
import { formatINR, getProductPricing } from '../lib/money'
import { useShop } from '../store/ShopContext'
import type { Product } from '../types'

type GalleryView = {
  src: string
  mode: 'natural' | 'detail' | 'close' | 'fit'
  label: string
}

export default function ProductPage() {
  const { id } = useParams()
  const { addToCart, toggleWishlist, isWishlisted } = useShop()
  const [product, setProduct] = useState<Product | null>(null)
  const [related, setRelated] = useState<Product[]>([])
  const [size, setSize] = useState('M')
  const [qty, setQty] = useState(1)
  const [image, setImage] = useState(0)
  const [failedImages, setFailedImages] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    Promise.all([fetchProduct(id || ''), fetchCatalog()]).then(([item, catalog]) => {
      setProduct(item)
      if (item) {
        setSize(item.sizes?.[0] || 'M')
        setRelated(catalog.filter((p) => p.category === item.category && p.id !== item.id).slice(0, 16))
      }
      setLoading(false)
      setImage(0)
      setFailedImages([])
    })
  }, [id])

  const galleryViews = useMemo<GalleryView[]>(() => {
    if (!product) return []
    const unique = Array.from(new Set([...(product.images ?? []), product.thumbnail].filter(Boolean))).filter((src) => !failedImages.includes(src))
    if (unique.length > 1) return unique.slice(0, 6).map((src, index) => ({ src, mode: 'natural', label: `Product view ${index + 1}` }))
    if (unique.length === 1) {
      const src = unique[0]
      return [
        { src, mode: 'natural', label: 'Full view' },
        { src, mode: 'detail', label: 'Detail view' },
        { src, mode: 'fit', label: 'Fit view' },
        { src, mode: 'close', label: 'Close detail' },
      ]
    }
    return []
  }, [product, failedImages])

  if (loading) return <div className="container product-loading"><div className="skeleton detail-image-skeleton"/><div className="skeleton detail-copy-skeleton"/></div>
  if (!product) return <div className="empty-state standalone"><h2>That piece moved fast.</h2><p>It is no longer available in the women’s catalog.</p><Link className="button primary" to="/shop">Back to shop</Link></div>

  const pricing = getProductPricing(product)
  const wished = isWishlisted(product.id)
  const activeView = galleryViews[image] || galleryViews[0]
  const failImage = (src: string) => {
    setFailedImages((current) => current.includes(src) ? current : [...current, src])
    setImage(0)
  }

  return <>
    <div className="container-wide product-page">
      <div className="breadcrumbs"><Link to="/">Home</Link><span>/</span><Link to={`/shop?category=${product.category}`}>{categoryLabel(product.category)}</Link><span>/</span><span>{product.title}</span></div>
      <div className="product-detail">
        <section className="product-gallery">
          <div className="thumb-list">{galleryViews.slice(0,6).map((view,index) => <button className={index === image ? 'active' : ''} key={`${view.src}-${view.mode}-${index}`} onClick={() => setImage(index)} aria-label={view.label}><img className={view.mode === 'natural' ? '' : `gallery-${view.mode}`} src={view.src} alt="" onError={() => failImage(view.src)} /></button>)}</div>
          <div className="main-product-image">{activeView ? <img className={activeView.mode === 'natural' ? '' : `gallery-${activeView.mode}`} src={activeView.src} alt={product.title} onError={() => failImage(activeView.src)} /> : <div className="product-detail-fallback"><ImageOff size={32}/><strong>VELOURA</strong><span>{categoryLabel(product.category)}</span></div>}{pricing.discount > 0 && <span>{pricing.discount}% OFF</span>}</div>
        </section>
        <section className="product-info"><span className="eyebrow">{product.brand || 'VELOURA EDIT'}</span><h1>{product.title}</h1><div className="detail-rating"><span><Star size={15} fill="currentColor"/> {(product.rating ?? 4.5).toFixed(1)}</span><b>{product.reviews?.length || 128} ratings</b></div><p className="detail-description">{product.description}</p><div className="detail-price"><strong>{formatINR(pricing.selling)}</strong>{pricing.discount > 0 && <><s>{formatINR(pricing.mrp)}</s><span>({pricing.discount}% OFF)</span></>}</div><small className="tax-note">inclusive of all taxes</small>

          <div className="detail-section"><div className="detail-label"><strong>SELECT SIZE</strong><button>SIZE GUIDE</button></div><div className="detail-sizes">{(product.sizes?.length ? product.sizes : ['XS','S','M','L','XL']).map((s) => <button className={s === size ? 'active' : ''} key={s} onClick={() => setSize(s)}>{s}</button>)}</div></div>
          <div className="buy-row"><div className="quantity"><button onClick={() => setQty(Math.max(1,qty-1))}><Minus size={15}/></button><span>{qty}</span><button onClick={() => setQty(qty+1)}><Plus size={15}/></button></div><button className="button primary add-bag" onClick={() => addToCart(product,size,qty)}>Add to bag</button><button className={`button wishlist-detail ${wished ? 'active' : ''}`} onClick={() => toggleWishlist(product)}><Heart size={18} fill={wished ? 'currentColor' : 'none'}/>{wished ? 'Saved' : 'Wishlist'}</button></div>

          <div className="delivery-box"><h3>Delivery options</h3><div className="pincode"><MapPin size={18}/><input placeholder="Enter pincode" inputMode="numeric"/><button>CHECK</button></div><p><Truck size={17}/> Free delivery above ₹1,499</p><p><ShieldCheck size={17}/> Easy 30-day return and exchange</p></div>
          <div className="offer-box"><h3>Best offers</h3><p><b>WELCOME OFFER</b> — Extra 10% off with code <strong>HELLOVELOURA</strong></p><p><b>APP OFFER</b> — ₹300 off on orders above ₹1,999</p></div>
          <details open><summary>Product details</summary><p>{product.description} Designed as part of the women-only Veloura edit with an easy, modern fit.</p></details><details><summary>Material & care</summary><p>Follow the care label. Gentle washing and low heat are recommended for delicate finishes.</p></details><details><summary>Shipping & returns</summary><p>Standard delivery is free above ₹1,499. Returns are accepted within 30 days for eligible items.</p></details>
          {product.source === 'solescout' && product.sourceUrl && <p className="source-attribution">Marketplace reference via <a href={product.sourceUrl} target="_blank" rel="noreferrer">SoleScout</a>. Availability and reference pricing can change daily.</p>}
        </section>
      </div>
    </div>
    {related.length > 0 && <ProductRail eyebrow="YOU MAY ALSO LIKE" title="More from this edit" products={related} href={`/shop?category=${product.category}`}/>} 
  </>
}
