import { ChevronLeft, ChevronRight, Heart, ImageOff, MapPin, Maximize2, Minus, Plus, ShieldCheck, Star, Truck, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import ProductRail from '../components/ProductRail'
import StyleThisPiece from '../components/StyleThisPiece'
import ReviewSummary from '../components/ReviewSummary'
import { categoryLabel } from '../data/catalog'
import { fetchCatalog, fetchCategoryCatalog, fetchProduct } from '../lib/api'
import { formatINR, getProductPricing } from '../lib/money'
import { completeTheLook, similarProducts } from '../lib/recommendations'
import { recommendForYou } from '../lib/personalization'
import { defaultProductSize, productSizes } from '../lib/sizing'
import { colorSwatch, discoverColorways, productConfidence, productImageMode } from '../lib/productIntelligence'
import { useShop } from '../store/ShopContext'
import type { Product } from '../types'

type GalleryView = { src: string; label: string }

export default function ProductPage() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const categoryHint = searchParams.get('category') || ''
  const { addToCart, toggleWishlist, isWishlisted, recordRecentlyViewed, recentlyViewed, preferenceSignals } = useShop()
  const [product, setProduct] = useState<Product | null>(null)
  const [similar, setSimilar] = useState<Product[]>([])
  const [complete, setComplete] = useState<Product[]>([])
  const [picked, setPicked] = useState<Product[]>([])
  const [colorways, setColorways] = useState<Product[]>([])
  const [size, setSize] = useState('M')
  const [qty, setQty] = useState(1)
  const [image, setImage] = useState(0)
  const [failedImages, setFailedImages] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false)
  const [viewerOpen, setViewerOpen] = useState(false)
  const [pincode, setPincode] = useState('')
  const [deliveryChecked, setDeliveryChecked] = useState(false)
  const [touchStartX, setTouchStartX] = useState<number | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    ;(async () => {
      let item = await fetchProduct(id || '')
      const baseCatalog = await fetchCatalog()
      let categoryCatalog = baseCatalog

      if (!item && categoryHint) {
        categoryCatalog = await fetchCategoryCatalog(categoryHint)
        item = categoryCatalog.find((candidate) => candidate.id === Number(id)) ?? null
      } else if (item) {
        try { categoryCatalog = await fetchCategoryCatalog(item.category) } catch { /* keep base catalog */ }
      }

      if (cancelled) return
      setProduct(item)
      if (item) {
        setSize(defaultProductSize(item))
        setSimilar(similarProducts(item, categoryCatalog, 18))
        setComplete(completeTheLook(item, baseCatalog, 16))
        const hasPreferenceSignals = Object.values(preferenceSignals.categories).some((value) => value > 0) || Object.values(preferenceSignals.brands).some((value) => value > 0)
        setPicked(hasPreferenceSignals ? recommendForYou(baseCatalog, preferenceSignals, [item.id, ...recentlyViewed.map((entry) => entry.id)], 16) : [])
        setColorways(discoverColorways(item, categoryCatalog, 7))
        recordRecentlyViewed(item)
      } else {
        setSimilar([])
        setComplete([])
        setPicked([])
        setColorways([])
      }
      setLoading(false)
      setImage(0)
      setFailedImages([])
      setQty(1)
      setDeliveryChecked(false)
    })().catch(() => {
      if (cancelled) return
      setProduct(null)
      setSimilar([])
      setComplete([])
      setPicked([])
      setColorways([])
      setLoading(false)
    })
    return () => { cancelled = true }
  }, [id, categoryHint, recordRecentlyViewed])

  const galleryViews = useMemo<GalleryView[]>(() => {
    if (!product) return []
    return Array.from(new Set([...(product.images ?? []), product.thumbnail].filter(Boolean)))
      .filter((src) => !failedImages.includes(src))
      .slice(0, 8)
      .map((src, index) => ({ src, label: `Product view ${index + 1}` }))
  }, [product, failedImages])

  useEffect(() => {
    if (!viewerOpen && !sizeGuideOpen) return
    document.body.classList.add('modal-open')
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setViewerOpen(false); setSizeGuideOpen(false) }
      if (viewerOpen && galleryViews.length > 1 && event.key === 'ArrowRight') setImage((current) => (current + 1) % galleryViews.length)
      if (viewerOpen && galleryViews.length > 1 && event.key === 'ArrowLeft') setImage((current) => (current - 1 + galleryViews.length) % galleryViews.length)
    }
    window.addEventListener('keydown', onKey)
    return () => { document.body.classList.remove('modal-open'); window.removeEventListener('keydown', onKey) }
  }, [viewerOpen, sizeGuideOpen, galleryViews.length])

  if (loading) return <div className="container product-loading"><div className="skeleton detail-image-skeleton"/><div className="skeleton detail-copy-skeleton"/></div>
  if (!product) return <div className="empty-state standalone"><h2>That piece moved fast.</h2><p>It is no longer available in the women’s catalog.</p><Link className="button primary" to="/shop">Back to shop</Link></div>

  const pricing = getProductPricing(product)
  const confidence = productConfidence(product)
  const imageMode = productImageMode(product)
  const wished = isWishlisted(product.id)
  const activeView = galleryViews[image] || galleryViews[0]
  const failImage = (src: string) => { setFailedImages((current) => current.includes(src) ? current : [...current, src]); setImage(0) }
  const canCheckDelivery = /^\d{6}$/.test(pincode)
  const recentWithoutCurrent = recentlyViewed.filter((item) => item.id !== product.id).slice(0, 16)

  const previousImage = () => setImage((current) => (current - 1 + galleryViews.length) % galleryViews.length)
  const nextImage = () => setImage((current) => (current + 1) % galleryViews.length)
  const finishSwipe = (endX: number) => {
    if (touchStartX === null || galleryViews.length <= 1) return setTouchStartX(null)
    const delta = endX - touchStartX
    if (Math.abs(delta) > 48) delta < 0 ? nextImage() : previousImage()
    setTouchStartX(null)
  }

  return <>
    <div className="container-wide product-page">
      <div className="breadcrumbs"><Link to="/">Home</Link><span>/</span><Link to={`/shop?category=${product.category}`}>{categoryLabel(product.category)}</Link><span>/</span><span>{product.title}</span></div>
      <div className="product-detail">
        <section className={`product-gallery ${galleryViews.length <= 1 ? 'single-gallery' : ''}`}>
          {galleryViews.length > 1 && <div className="thumb-list">{galleryViews.map((view,index) => <button className={index === image ? 'active' : ''} key={view.src} onClick={() => setImage(index)} aria-label={view.label}><img src={view.src} alt="" onError={() => failImage(view.src)} /></button>)}</div>}
          <div className={`main-product-image ${galleryViews.length === 1 ? 'single-image' : ''} image-mode-${imageMode}`} onTouchStart={(event) => setTouchStartX(event.touches[0]?.clientX ?? null)} onTouchEnd={(event) => finishSwipe(event.changedTouches[0]?.clientX ?? 0)}>{activeView ? <img src={activeView.src} alt={product.title} onError={() => failImage(activeView.src)} /> : <div className="product-detail-fallback"><ImageOff size={32}/><strong>VELOURA</strong><span>{categoryLabel(product.category)}</span></div>}{pricing.discount > 0 && <span>{pricing.discount}% OFF</span>}{activeView && <button className="gallery-expand" onClick={() => setViewerOpen(true)} aria-label="Open fullscreen gallery"><Maximize2 size={17}/></button>}{galleryViews.length > 1 && <div className="mobile-gallery-nav"><button onClick={previousImage}><ChevronLeft size={18}/></button><b>{image + 1}/{galleryViews.length}</b><button onClick={nextImage}><ChevronRight size={18}/></button></div>}</div>
        </section>
        <section className="product-info">{product.brand ? <Link className="eyebrow pdp-brand-link" to={`/brand/${encodeURIComponent(product.brand)}`}>{product.brand} · BRAND STORE</Link> : <span className="eyebrow">VELOURA EDIT</span>}<h1>{product.title}</h1>{product.rating !== undefined && <div className="detail-rating"><span><Star size={15} fill="currentColor"/> {product.rating.toFixed(1)}</span><b>{product.reviews?.length ? `${product.reviews.length} written reviews` : 'Catalog rating'}</b></div>}<p className="detail-description">{product.description}</p><div className="detail-price"><strong>{formatINR(pricing.selling)}</strong>{pricing.discount > 0 && <><s>{formatINR(pricing.mrp)}</s><span>({pricing.discount}% OFF)</span></>}</div><small className="tax-note">inclusive of all taxes</small>{product.color && <div className="pdp-color-line"><i style={{backgroundColor:colorSwatch(product.color)}}/><span>Colour</span><strong>{product.color}</strong></div>}{colorways.length > 0 && <div className="pdp-colorways"><div className="detail-label"><strong>OTHER COLOURS</strong><span>{colorways.length} similar colourways</span></div><div>{colorways.map((item) => <Link key={item.id} to={`/product/${item.id}?category=${encodeURIComponent(item.category)}`} aria-label={`${item.color || 'Colour'}: ${item.title}`}><i style={{backgroundColor:colorSwatch(item.color)}}/><span>{item.color}</span></Link>)}</div></div>}

          <div className="detail-section" id="size-guide"><div className="detail-label"><strong>SELECT SIZE</strong><button onClick={() => setSizeGuideOpen(true)}>SIZE GUIDE</button></div><div className="detail-sizes">{productSizes(product).map((s) => <button className={s === size ? 'active' : ''} key={s} onClick={() => setSize(s)}>{s}</button>)}</div></div>
          <div className="buy-row"><div className="quantity"><button onClick={() => setQty(Math.max(1,qty-1))}><Minus size={15}/></button><span>{qty}</span><button onClick={() => setQty(qty+1)}><Plus size={15}/></button></div><button className="button primary add-bag" onClick={() => addToCart(product,size,qty)}>Add to bag</button><button className={`button wishlist-detail ${wished ? 'active' : ''}`} onClick={() => toggleWishlist(product)}><Heart size={18} fill={wished ? 'currentColor' : 'none'}/>{wished ? 'Saved' : 'Wishlist'}</button></div>

          <div className="delivery-box"><h3>Delivery options</h3><div className="pincode"><MapPin size={18}/><input value={pincode} onChange={(event) => { setPincode(event.target.value.replace(/\D/g,'').slice(0,6)); setDeliveryChecked(false) }} placeholder="Enter 6-digit pincode" inputMode="numeric"/><button disabled={!canCheckDelivery} onClick={() => setDeliveryChecked(true)}>CHECK</button></div>{deliveryChecked && <div className="delivery-result"><strong>Delivery available</strong><span>Final estimate and shipping charge are shown at checkout.</span></div>}<p><Truck size={17}/> Free delivery above ₹1,499</p><p><ShieldCheck size={17}/> Easy 30-day return and exchange on eligible items</p></div>
          <div className="product-confidence"><div><ShieldCheck size={17}/><span><strong>{confidence.label}</strong><small>Live catalog information</small></span></div><p>Images, pricing and available attributes come from the live catalog. Missing ratings, colours or review counts are left blank rather than filled with placeholders.</p></div>
          <div className="offer-box"><h3>Best offers</h3><p><b>WELCOME OFFER</b> — Extra 10% off with code <strong>HELLOVELOURA</strong></p><p><b>ORDER OFFER</b> — ₹300 off on orders above ₹1,999</p></div>
          <details open><summary>Product details</summary><p>{product.description}</p>{product.color && <p><strong>Colour:</strong> {product.color}</p>}{product.occasion && <p><strong>Occasion:</strong> {product.occasion}</p>}</details><details><summary>Fit & sizing</summary><p>{product.sizes?.length ? `Available sizes: ${product.sizes.join(', ')}. Use the Veloura size guide as a general reference; brand-specific sizing may vary.` : 'This item uses one-size or provider-specific sizing. Check the size guide before ordering.'}</p></details><details><summary>Material & care</summary><p>Follow the product care label where provided. For delicate finishes, prefer gentle washing, low heat and careful storage.</p></details><details><summary>Shipping & returns</summary><p>Standard delivery is free above ₹1,499. Eligible items can be returned within 30 days; exclusions are explained in the Returns policy.</p><Link to="/help/returns">Read return policy →</Link></details>
          {product.reviews?.length ? <><ReviewSummary reviews={product.reviews}/><div className="reviews-block"><div className="detail-label"><strong>RECENT REVIEWS</strong><span>{product.reviews.length} total</span></div>{product.reviews.slice(0,3).map((review,index) => <article key={`${review.reviewerEmail || review.reviewerName || 'review'}-${index}`}><span><Star size={12} fill="currentColor"/> {review.rating.toFixed(1)}</span><p>{review.comment}</p><small>{review.reviewerName || 'Catalog reviewer'}{review.date ? ` · ${new Date(review.date).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}` : ''}</small></article>)}</div></> : <div className="reviews-empty"><strong>Reviews</strong><p>No written reviews are available for this catalog item yet.</p></div>}
          {product.sourceLabel && <p className="source-attribution">Catalog source: <strong>{product.sourceLabel}</strong>{product.sourceUrl && <> · <a href={product.sourceUrl} target="_blank" rel="noreferrer">reference</a></>}</p>}
        </section>
      </div>
    </div>

    <div className="mobile-pdp-buy"><div><small>{product.brand || 'Veloura Edit'}</small><strong>{formatINR(pricing.selling)}</strong></div><button className="button primary" onClick={() => addToCart(product,size,qty)}>Add to bag</button></div>

    {complete.length > 0 && <StyleThisPiece product={product} candidates={complete} />}

    {similar.length > 0 && <ProductRail eyebrow="SIMILAR STYLES" title="More like this" subtitle="Selected using category, price, brand, colour and style signals." products={similar} href={`/shop?category=${product.category}`}/>} 
    {complete.length > 0 && <ProductRail eyebrow="COMPLETE THE LOOK" title="Style it together" subtitle="Complementary pieces from across the women’s store." products={complete}/>} 
    {picked.length > 0 && <ProductRail eyebrow="PICKED FOR YOU" title="Your next discovery" subtitle="Ranked from the departments, brands and colours you interact with." products={picked}/>} 
    {recentWithoutCurrent.length > 0 && <ProductRail eyebrow="RECENTLY VIEWED" title="Pick up where you left off" products={recentWithoutCurrent}/>} 

    {viewerOpen && activeView && <div className="gallery-viewer" onMouseDown={() => setViewerOpen(false)}><button className="gallery-viewer-close" onClick={() => setViewerOpen(false)}><X size={22}/></button>{galleryViews.length > 1 && <button className="gallery-viewer-prev" onClick={(event) => { event.stopPropagation(); previousImage() }}><ChevronLeft/></button>}<img src={activeView.src} alt={product.title} onMouseDown={(event) => event.stopPropagation()}/>{galleryViews.length > 1 && <button className="gallery-viewer-next" onClick={(event) => { event.stopPropagation(); nextImage() }}><ChevronRight/></button>}<span>{image + 1} / {galleryViews.length}</span></div>}

    {sizeGuideOpen && <div className="size-guide-backdrop" onMouseDown={() => setSizeGuideOpen(false)}><section className="size-guide-modal" onMouseDown={(event) => event.stopPropagation()}><button className="size-guide-close" onClick={() => setSizeGuideOpen(false)}><X size={20}/></button><span className="eyebrow">VELOURA FIT GUIDE</span><h2>Find your size</h2><p>Use this as a general reference. Brand sizing can vary, so product-specific measurements should take priority when available.</p><SizeGuide category={product.category}/><Link to="/help/size-guide" onClick={() => setSizeGuideOpen(false)}>Open full size guide →</Link></section></div>}
  </>
}

function SizeGuide({ category }: { category: string }) {
  if (category === 'womens-shoes') return <div className="size-table"><div><b>EU</b><b>36</b><b>37</b><b>38</b><b>39</b><b>40</b><b>41</b></div><div><span>Foot length (cm)</span><span>22.8</span><span>23.5</span><span>24.1</span><span>24.8</span><span>25.4</span><span>26.0</span></div></div>
  if (['womens-bags','womens-jewellery','womens-beauty','womens-skincare','womens-haircare','womens-fragrance','womens-watches','womens-sunglasses','womens-accessories'].includes(category)) return <div className="one-size-note"><strong>One size</strong><p>This category usually does not use apparel sizing. Check dimensions in the product information where available.</p></div>
  return <div className="size-table"><div><b>Size</b><b>XS</b><b>S</b><b>M</b><b>L</b><b>XL</b></div><div><span>Bust (in)</span><span>32</span><span>34</span><span>36</span><span>38</span><span>40</span></div><div><span>Waist (in)</span><span>25</span><span>27</span><span>29</span><span>31</span><span>33</span></div><div><span>Hip (in)</span><span>35</span><span>37</span><span>39</span><span>41</span><span>43</span></div></div>
}
