import { ArrowRight, BadgePercent, ChevronRight, RotateCcw, ShieldCheck, Sparkles, Truck } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import ProductRail from '../components/ProductRail'
import CampaignStory from '../components/CampaignStory'
import ShopTheLook from '../components/ShopTheLook'
import { WOMEN_CATEGORIES, categoryLabel } from '../data/catalog'
import { fetchCatalog } from '../lib/api'
import { getProductPricing } from '../lib/money'
import { recommendForYou, topPreference, trendingProducts } from '../lib/personalization'
import { productMerchandisingScore } from '../lib/productIntelligence'
import { useShop } from '../store/ShopContext'
import type { Product } from '../types'

const occasionCards = [
  { title: 'Party & Night Out', subtitle: 'Dresses that own the room', slug: 'after-dark', image: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=1000&q=92' },
  { title: 'Workwear Refresh', subtitle: 'Polished, never predictable', slug: 'soft-tailoring', image: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=1000&q=92' },
  { title: 'Festive Dressing', subtitle: 'Modern celebration pieces', slug: 'modern-festive', image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1000&q=92' },
  { title: 'Vacation Mode', subtitle: 'Easy pieces for going away', slug: 'vacation-mode', image: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=1000&q=92' },
]

const inCategories = (products: Product[], categories: string[]) => products.filter((product) => categories.includes(product.category)).sort((a,b) => productMerchandisingScore(b) - productMerchandisingScore(a))

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const { recentlyViewed, wishlist, preferenceSignals } = useShop()

  useEffect(() => {
    fetchCatalog().then((catalog) => { setProducts(catalog); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  const merchandising = useMemo(() => {
    const byDiscount = [...products].sort((a, b) => (b.discountPercentage ?? 0) - (a.discountPercentage ?? 0))
    const byRating = trendingProducts(products, 24)
    const under999 = products.filter((product) => getProductPricing(product).selling <= 999)
    const under1499 = products.filter((product) => getProductPricing(product).selling <= 1499)
    const newDrops = [...products].sort((a, b) => b.id - a.id)

    return {
      bestDeals: byDiscount.slice(0, 16),
      topRated: byRating.slice(0, 16),
      dresses: inCategories(products, ['womens-dresses']).slice(0, 16),
      topsCoords: inCategories(products, ['womens-tops', 'womens-coords', 'womens-bottoms']).slice(0, 16),
      footwear: inCategories(products, ['womens-shoes']).slice(0, 16),
      bagsAndFinishing: inCategories(products, ['womens-bags', 'womens-jewellery', 'womens-watches', 'womens-sunglasses', 'womens-accessories']).slice(0, 16),
      beauty: inCategories(products, ['womens-beauty', 'womens-skincare', 'womens-haircare', 'womens-fragrance']).slice(0, 16),
      movement: inCategories(products, ['womens-activewear', 'womens-swimwear', 'womens-lingerie', 'womens-sleepwear']).slice(0, 16),
      layers: inCategories(products, ['womens-denim', 'womens-outerwear', 'womens-winterwear']).slice(0, 16),
      ethnic: inCategories(products, ['womens-ethnicwear']).slice(0, 16),
      budget: (under999.length >= 8 ? under999 : under1499).slice(0, 16),
      newDrops: newDrops.slice(0, 16),
      multiImage: products.filter((product) => product.images.length >= 2).length,
      covered: new Set(products.map((product) => product.category)).size,
    }
  }, [products])

  const personal = useMemo(() => {
    const signalWeight = Object.values(preferenceSignals.categories).reduce((sum, value) => sum + value, 0)
      + Object.values(preferenceSignals.brands).reduce((sum, value) => sum + value, 0)
    const favoriteCategory = topPreference(preferenceSignals, 'categories')
    const favoriteBrand = topPreference(preferenceSignals, 'brands')
    const favoriteColor = topPreference(preferenceSignals, 'colors')
    const excluded = [...recentlyViewed, ...wishlist].map((product) => product.id)
    const forYou = signalWeight > 0 ? recommendForYou(products, preferenceSignals, excluded, 18) : []
    const becauseCategory = favoriteCategory ? products
      .filter((product) => product.category === favoriteCategory && !excluded.includes(product.id))
      .sort((a,b) => (b.rating ?? 0) - (a.rating ?? 0))
      .slice(0,16) : []

    const brandMap = new Map<string, { count: number; product: Product }>()
    products.forEach((product) => {
      if (!product.brand) return
      const current = brandMap.get(product.brand)
      if (!current) brandMap.set(product.brand, { count: 1, product })
      else current.count += 1
    })
    const topBrands = [...brandMap.entries()].sort((a,b) => b[1].count - a[1].count).slice(0,4)

    return { signalWeight, favoriteCategory, favoriteBrand, favoriteColor, forYou, becauseCategory, topBrands }
  }, [products, preferenceSignals, recentlyViewed, wishlist])

  return <>
    <section className="marketplace-hero container-wide">
      <Link className="hero-main" to="/shop?category=womens-dresses">
        <img src="https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=2200&q=94" alt="Veloura women's fashion new season" />
        <div className="hero-overlay" />
        <div className="hero-content"><span>THE BIG WOMEN'S EDIT · 2026</span><h1>New season.<br />Main character energy.</h1><p>Fashion, footwear, accessories, beauty, skincare and more—one seriously big women-only destination.</p><div className="hero-actions"><span className="button light">Shop new in <ArrowRight size={17} /></span><span className="hero-offer">UP TO 60% OFF</span></div></div>
      </Link>
      <div className="hero-side">
        <Link className="hero-tile" to="/shop?category=womens-ethnicwear"><img src="https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1000&q=92" alt="Women's ethnic wear" /><div><small>FESTIVE STORE</small><strong>Modern ethnic, major compliments</strong><span>Shop now <ChevronRight size={15} /></span></div></Link>
        <Link className="hero-tile" to="/shop?sort=discount"><img src="https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1000&q=92" alt="Women's fashion sale" /><div><small>PRICE DROP</small><strong>Big-store energy, better prices</strong><span>Explore sale <ChevronRight size={15} /></span></div></Link>
      </div>
    </section>

    <CampaignStory />

    <section className="trust-strip marketplace-trust"><div><Truck /><span><strong>Free delivery</strong>Above ₹1,499</span></div><div><RotateCcw /><span><strong>Easy returns</strong>30-day window</span></div><div><ShieldCheck /><span><strong>Secure checkout</strong>No payment data stored</span></div><div><Sparkles /><span><strong>Women-only universe</strong>22 structured departments</span></div></section>

    {!loading && <section className="catalog-scale-strip container-wide"><div><strong>{products.length.toLocaleString('en-IN')}</strong><span>unique styles live</span></div><div><strong>{merchandising.covered}</strong><span>departments with inventory</span></div><div><strong>{merchandising.multiImage.toLocaleString('en-IN')}</strong><span>multi-image products</span></div><div><strong>8+</strong><span>managed catalog feeds</span></div></section>}

    <section className="category-shelf container-wide"><div className="section-heading simple-heading"><div><span className="eyebrow">SHOP WHAT YOU LOVE</span><h2>Explore the women’s universe</h2></div><Link to="/shop">View all <ArrowRight size={15} /></Link></div><div className="category-circles">{WOMEN_CATEGORIES.map((category) => <Link key={category.value} className="category-circle" to={`/shop?category=${category.value}`}><span><img src={category.image} alt={category.label} loading="lazy" /></span><strong>{category.label}</strong><small>{category.blurb}</small></Link>)}</div></section>

    <section className="coupon-section container-wide"><div className="section-heading simple-heading"><div><span className="eyebrow">MORE STYLE, LESS SPEND</span><h2>Offers for you</h2></div></div><div className="coupon-grid"><div className="coupon-card"><BadgePercent /><div><small>FIRST ORDER</small><strong>Extra 10% off</strong><span>Use code <b>HELLOVELOURA</b></span></div></div><div className="coupon-card"><BadgePercent /><div><small>ORDER OFFER</small><strong>₹300 off</strong><span>On orders above ₹1,999</span></div></div><div className="coupon-card"><Truck /><div><small>FREE SHIPPING</small><strong>Zero delivery fee</strong><span>On orders above ₹1,499</span></div></div><div className="coupon-card"><Sparkles /><div><small>WEEKEND DROP</small><strong>Up to 60% off</strong><span>Selected women’s styles</span></div></div></div></section>

    {recentlyViewed.length > 0 && <ProductRail eyebrow="PICK UP WHERE YOU LEFT OFF" title="Recently viewed" subtitle="Your latest Veloura discoveries, saved on this device." products={recentlyViewed.slice(0,16)} />}
    {wishlist.length > 0 && <ProductRail eyebrow="YOUR SHORTLIST" title="Saved for later" subtitle="Pieces already on your radar." products={wishlist.slice(0,16)} href="/wishlist" />}

    {!loading && personal.signalWeight > 0 && <section className="style-profile-band container-wide"><div><span className="eyebrow">YOUR VELOURA PROFILE</span><h2>Your store is learning your taste.</h2><p>Recommendations adapt from products you view, save and add to bag. These preference signals stay in this browser.</p></div><div className="style-profile-signals">{personal.favoriteCategory && <span><small>Most explored</small><strong>{categoryLabel(personal.favoriteCategory)}</strong></span>}{personal.favoriteBrand && <span><small>Brand signal</small><strong>{personal.favoriteBrand}</strong></span>}{personal.favoriteColor && <span><small>Colour signal</small><strong>{personal.favoriteColor}</strong></span>}</div></section>}
    {!loading && personal.forYou.length > 0 && <ProductRail eyebrow="CURATED FOR YOU" title="Your Veloura edit" subtitle="Ranked from your recent browsing, saves and bag activity." products={personal.forYou} />}
    {!loading && personal.favoriteCategory && personal.becauseCategory.length > 0 && <ProductRail eyebrow="BECAUSE YOU KEEP EXPLORING" title={`More ${categoryLabel(personal.favoriteCategory)}`} subtitle="A deeper edit from the department you come back to most." products={personal.becauseCategory} href={`/shop?category=${personal.favoriteCategory}`} />}

    {!loading && <ShopTheLook products={products} />}

    {loading ? <LoadingRail /> : <ProductRail eyebrow="HOT RIGHT NOW" title="Trending now" subtitle="High-rated pieces across the women’s store." products={merchandising.topRated} href="/shop?sort=rating" />}

    <section className="occasion-section container-wide"><div className="section-heading simple-heading"><div><span className="eyebrow">DRESS FOR THE PLAN</span><h2>Shop by occasion</h2><p>Open a full Veloura edit instead of another generic search page.</p></div><Link to="/edits">View all edits <ArrowRight size={15}/></Link></div><div className="occasion-grid">{occasionCards.map((card) => <Link className="occasion-card" key={card.title} to={`/edit/${card.slug}`}><img src={card.image} alt={card.title} loading="lazy" /><div className="occasion-overlay" /><div><span>{card.subtitle}</span><h3>{card.title}</h3><b>Shop the edit <ArrowRight size={15} /></b></div></Link>)}</div></section>

    {!loading && <ProductRail eyebrow="THE MARKDOWN EDIT" title="Biggest deals" subtitle="Fresh price drops across the women’s store." products={merchandising.bestDeals} href="/shop?sort=discount" />}

    {!loading && personal.topBrands.length > 0 && <section className="brand-deals container-wide"><div className="section-heading simple-heading"><div><span className="eyebrow">BRANDS IN YOUR STORE</span><h2>Explore labels with real catalog depth</h2></div></div><div className="brand-deal-grid">{personal.topBrands.map(([brand, data]) => <Link key={brand} to={`/brand/${encodeURIComponent(brand)}`} className="brand-deal-card"><img src={data.product.images?.[0] || data.product.thumbnail} alt={brand} loading="lazy" /><div><span>{data.count} STYLES LIVE</span><h3>{brand}</h3><b>Open brand store <ArrowRight size={14} /></b></div></Link>)}</div></section>}

    {!loading && <ProductRail eyebrow="EVERYDAY WINS" title="Under ₹999" subtitle="High rotation, low commitment." products={merchandising.budget} href="/shop?max=999" compact />}
    {!loading && <ProductRail eyebrow="THE DRESS STORE" title="Dresses for every version of tonight" subtitle="Mini, midi, maxi and occasion silhouettes with richer product galleries." products={merchandising.dresses} href="/shop?category=womens-dresses" />}
    {!loading && <ProductRail eyebrow="PUT TOGETHER IN SECONDS" title="Tops, co-ords & easy separates" products={merchandising.topsCoords} href="/shop?category=womens-tops" />}
    {!loading && <ProductRail eyebrow="FROM THE GROUND UP" title="The footwear store" subtitle="Sneakers, heels, flats, trainers and more." products={merchandising.footwear} href="/shop?category=womens-shoes" />}

    <section className="editorial-split container-wide"><div className="editorial-image"><img src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1600&q=94" alt="Women's fashion editorial" /></div><div className="editorial-copy"><span className="eyebrow">THE VELOURA EDITOR'S DESK</span><h2>One wardrobe.<br />A hundred versions of you.</h2><p>Build from pieces that work harder: a sharp shirt, a great dress, easy co-ords and accessories that change the whole mood.</p><div className="editorial-links"><Link to="/shop?q=work">Workwear refresh <ArrowRight size={15} /></Link><Link to="/shop?q=party">After-dark edit <ArrowRight size={15} /></Link><Link to="/shop?q=vacation">Vacation packing list <ArrowRight size={15} /></Link></div></div></section>

    {!loading && <ProductRail eyebrow="THE GETTING-READY SHELF" title="Beauty, skincare, hair & fragrance" subtitle="Makeup, skin ritual, hair favourites and scent discoveries." products={merchandising.beauty} href="/shop?category=womens-beauty" />}
    {!loading && <ProductRail eyebrow="THE FINISHING TOUCH" title="Bags, jewellery, watches & shades" products={merchandising.bagsAndFinishing} href="/shop?category=womens-bags" />}
    {!loading && <ProductRail eyebrow="MOVE / SWIM / LOUNGE" title="Activewear and off-duty essentials" products={merchandising.movement} href="/shop?category=womens-activewear" />}
    {!loading && <ProductRail eyebrow="DENIM & LAYERS" title="Jackets, denim, knits and outerwear" products={merchandising.layers} href="/shop?category=womens-outerwear" />}
    {!loading && merchandising.ethnic.length > 0 && <ProductRail eyebrow="THE FESTIVE STORE" title="Ethnic dressing" products={merchandising.ethnic} href="/shop?category=womens-ethnicwear" />}
    {!loading && <ProductRail eyebrow="FRESH THIS WEEK" title="New drops" subtitle="Recently added across the Veloura women’s universe." products={merchandising.newDrops} href="/shop" />}

    <section className="category-wall container-wide"><div className="section-heading simple-heading"><div><span className="eyebrow">KEEP EXPLORING</span><h2>22 departments. Keep going.</h2></div></div><div className="category-wall-grid">{WOMEN_CATEGORIES.map((category, index) => <Link className={`category-wall-card c${index % 5}`} key={category.value} to={`/shop?category=${category.value}`}><img src={category.image} alt={category.label} loading="lazy" /><div><h3>{category.label}</h3><span>{category.blurb}</span><b>Shop now →</b></div></Link>)}</div></section>

    <section className="app-promo veloura-story-panel"><div className="container-wide app-promo-inner"><div><span className="eyebrow">HOW VELOURA WORKS</span><h2>Large catalog. Cleaner decisions.</h2><p>Veloura combines multiple product sources, removes duplicates and broken imagery, validates women’s departments, and then layers search, recommendations and editorial discovery on top.</p><div className="editorial-links"><Link to="/help/about">Read our approach <ArrowRight size={15}/></Link><Link to="/help/faq">How the catalog works <ArrowRight size={15}/></Link></div></div><div className="phone-mock"><div className="phone-notch" /><div className="phone-screen"><span>VELOURA</span><img src="https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=700&q=92" alt="Veloura mobile shopping" /><b>CURATED FOR WOMEN</b><small>Fashion · beauty · accessories</small></div></div></div></section>
  </>
}

function LoadingRail() {
  return <section className="rail-section container"><div className="section-heading marketplace-heading"><div><span className="eyebrow">HOT RIGHT NOW</span><h2>Trending now</h2></div></div><div className="product-rail">{Array.from({ length: 6 }).map((_, index) => <div key={index} className="skeleton product-skeleton" />)}</div></section>
}
