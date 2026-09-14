import { ArrowRight, BadgePercent, ChevronRight, RotateCcw, ShieldCheck, Sparkles, Truck } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import ProductRail from '../components/ProductRail'
import { WOMEN_CATEGORIES } from '../data/catalog'
import { fetchCatalog } from '../lib/api'
import { getProductPricing } from '../lib/money'
import type { Product } from '../types'

const occasionCards = [
  { title: 'Party & Night Out', subtitle: 'Dresses that own the room', q: 'party', image: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=1000&q=92' },
  { title: 'Workwear Refresh', subtitle: 'Polished, never predictable', q: 'work', image: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=1000&q=92' },
  { title: 'Festive Dressing', subtitle: 'Modern celebration pieces', q: 'festive', image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1000&q=92' },
  { title: 'Vacation Mode', subtitle: 'Easy pieces for going away', q: 'vacation', image: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=1000&q=92' },
]

const brandCards = [
  { brand: 'Solene Studio', offer: 'MIN. 35% OFF', image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=900&q=90' },
  { brand: 'Maison V', offer: 'BAGS FROM ₹1,199', image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=900&q=90' },
  { brand: 'Aara', offer: 'FESTIVE EDIT · 40% OFF', image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=900&q=90' },
  { brand: 'Halo Beauty', offer: 'BEAUTY UNDER ₹999', image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=900&q=90' },
]

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCatalog().then((catalog) => { setProducts(catalog); setLoading(false) })
  }, [])

  const merchandising = useMemo(() => {
    const byDiscount = [...products].sort((a, b) => (b.discountPercentage ?? 0) - (a.discountPercentage ?? 0))
    const byRating = [...products].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
    const dresses = products.filter((product) => product.category === 'womens-dresses')
    const accessories = products.filter((product) => ['womens-bags', 'womens-jewellery', 'womens-shoes'].includes(product.category))
    const under999 = products.filter((product) => getProductPricing(product).selling <= 999)
    const under1499 = products.filter((product) => getProductPricing(product).selling <= 1499)
    const newDrops = [...products].sort((a, b) => b.id - a.id)

    return {
      bestDeals: byDiscount.slice(0, 12),
      topRated: byRating.slice(0, 12),
      dresses: dresses.slice(0, 12),
      accessories: accessories.slice(0, 12),
      budget: (under999.length >= 6 ? under999 : under1499).slice(0, 12),
      newDrops: newDrops.slice(0, 12),
    }
  }, [products])

  return (
    <>
      <section className="marketplace-hero container-wide">
        <Link className="hero-main" to="/shop?category=womens-dresses">
          <img src="https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=2200&q=94" alt="Veloura women's fashion new season" />
          <div className="hero-overlay" />
          <div className="hero-content">
            <span>THE BIG WOMEN'S EDIT · 2026</span>
            <h1>New season.<br />Main character energy.</h1>
            <p>Dresses, co-ords, ethnic, accessories and beauty—one seriously good wardrobe refresh.</p>
            <div className="hero-actions"><span className="button light">Shop new in <ArrowRight size={17} /></span><span className="hero-offer">UP TO 60% OFF</span></div>
          </div>
        </Link>
        <div className="hero-side">
          <Link className="hero-tile" to="/shop?category=womens-ethnicwear">
            <img src="https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1000&q=92" alt="Women's ethnic wear" />
            <div><small>FESTIVE STORE</small><strong>Modern ethnic, major compliments</strong><span>Shop now <ChevronRight size={15} /></span></div>
          </Link>
          <Link className="hero-tile" to="/shop?sort=discount">
            <img src="https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1000&q=92" alt="Women's fashion sale" />
            <div><small>PRICE DROP</small><strong>Big-brand energy, smaller prices</strong><span>Explore sale <ChevronRight size={15} /></span></div>
          </Link>
        </div>
      </section>

      <section className="trust-strip marketplace-trust">
        <div><Truck /><span><strong>Free delivery</strong>Above ₹1,499</span></div>
        <div><RotateCcw /><span><strong>Easy returns</strong>30-day window</span></div>
        <div><ShieldCheck /><span><strong>Secure checkout</strong>No payment data stored</span></div>
        <div><Sparkles /><span><strong>Women-only edit</strong>Everything in one place</span></div>
      </section>

      <section className="category-shelf container-wide">
        <div className="section-heading simple-heading"><div><span className="eyebrow">SHOP WHAT YOU LOVE</span><h2>Women’s categories</h2></div><Link to="/shop">View all <ArrowRight size={15} /></Link></div>
        <div className="category-circles">
          {WOMEN_CATEGORIES.map((category) => (
            <Link key={category.value} className="category-circle" to={`/shop?category=${category.value}`}>
              <span><img src={category.image} alt={category.label} loading="lazy" /></span>
              <strong>{category.label}</strong>
              <small>{category.blurb}</small>
            </Link>
          ))}
        </div>
      </section>

      <section className="coupon-section container-wide">
        <div className="section-heading simple-heading"><div><span className="eyebrow">MORE STYLE, LESS SPEND</span><h2>Coupons for you</h2></div></div>
        <div className="coupon-grid">
          <div className="coupon-card"><BadgePercent /><div><small>FIRST ORDER</small><strong>Extra 10% off</strong><span>Use code <b>HELLOVELOURA</b></span></div></div>
          <div className="coupon-card"><BadgePercent /><div><small>APP EXCLUSIVE</small><strong>₹300 off</strong><span>On orders above ₹1,999</span></div></div>
          <div className="coupon-card"><Truck /><div><small>FREE SHIPPING</small><strong>Zero delivery fee</strong><span>On orders above ₹1,499</span></div></div>
          <div className="coupon-card"><Sparkles /><div><small>WEEKEND DROP</small><strong>Up to 60% off</strong><span>Selected women’s styles</span></div></div>
        </div>
      </section>

      {loading ? <LoadingRail /> : <ProductRail eyebrow="HOT RIGHT NOW" title="Trending now" subtitle="The pieces everyone keeps coming back for." products={merchandising.topRated} href="/shop?sort=rating" />}

      <section className="occasion-section container-wide">
        <div className="section-heading simple-heading"><div><span className="eyebrow">DRESS FOR THE PLAN</span><h2>Shop by occasion</h2></div></div>
        <div className="occasion-grid">
          {occasionCards.map((card) => (
            <Link className="occasion-card" key={card.title} to={`/shop?q=${encodeURIComponent(card.q)}`}>
              <img src={card.image} alt={card.title} loading="lazy" />
              <div className="occasion-overlay" />
              <div><span>{card.subtitle}</span><h3>{card.title}</h3><b>Shop the edit <ArrowRight size={15} /></b></div>
            </Link>
          ))}
        </div>
      </section>

      {!loading && <ProductRail eyebrow="DEALS WORTH OPENING THE APP FOR" title="Biggest deals" subtitle="Fresh markdowns across women’s fashion and accessories." products={merchandising.bestDeals} href="/shop?sort=discount" />}

      <section className="brand-deals container-wide">
        <div className="section-heading simple-heading"><div><span className="eyebrow">LABELS TO KNOW</span><h2>Top brands, better prices</h2></div></div>
        <div className="brand-deal-grid">
          {brandCards.map((card) => <Link key={card.brand} to={`/shop?q=${encodeURIComponent(card.brand)}`} className="brand-deal-card"><img src={card.image} alt={card.brand} loading="lazy" /><div><span>{card.offer}</span><h3>{card.brand}</h3><b>Explore <ArrowRight size={14} /></b></div></Link>)}
        </div>
      </section>

      {!loading && <ProductRail eyebrow="EVERYDAY WINS" title="Under ₹999" subtitle="High rotation, low commitment." products={merchandising.budget} href="/shop?max=999" compact />}

      <section className="editorial-split container-wide">
        <div className="editorial-image"><img src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1600&q=94" alt="Women's fashion editorial" /></div>
        <div className="editorial-copy"><span className="eyebrow">THE VELOURA EDITOR'S DESK</span><h2>One wardrobe.<br />A hundred versions of you.</h2><p>Build from pieces that work harder: a sharp shirt, a great dress, easy co-ords and accessories that change the whole mood.</p><div className="editorial-links"><Link to="/shop?q=work">Workwear refresh <ArrowRight size={15} /></Link><Link to="/shop?q=party">After-dark edit <ArrowRight size={15} /></Link><Link to="/shop?q=vacation">Vacation packing list <ArrowRight size={15} /></Link></div></div>
      </section>

      {!loading && <ProductRail eyebrow="FRESH THIS WEEK" title="New drops" subtitle="Recently added to the Veloura women’s universe." products={merchandising.newDrops} href="/shop" />}
      {!loading && <ProductRail eyebrow="THE DRESS STORE" title="Dresses for every version of tonight" products={merchandising.dresses} href="/shop?category=womens-dresses" />}
      {!loading && <ProductRail eyebrow="THE FINISHING TOUCH" title="Bags, shoes & jewellery" products={merchandising.accessories} href="/shop?category=womens-bags" />}

      <section className="category-wall container-wide">
        <div className="section-heading simple-heading"><div><span className="eyebrow">KEEP EXPLORING</span><h2>There’s a lot more to Veloura</h2></div></div>
        <div className="category-wall-grid">
          {WOMEN_CATEGORIES.map((category, index) => <Link className={`category-wall-card c${index % 5}`} key={category.value} to={`/shop?category=${category.value}`}><img src={category.image} alt={category.label} loading="lazy" /><div><h3>{category.label}</h3><span>{category.blurb}</span><b>Shop now →</b></div></Link>)}
        </div>
      </section>

      <section className="app-promo" id="download-app">
        <div className="container-wide app-promo-inner"><div><span className="eyebrow">VELOURA IN YOUR POCKET</span><h2>Drop alerts. Wishlist reminders. Better browsing.</h2><p>The full women’s store, wherever you are. This demo keeps the app-promo experience visual, while the web storefront remains fully functional.</p><div className="app-badges dark"><button>▶ Google Play</button><button> App Store</button></div></div><div className="phone-mock"><div className="phone-notch" /><div className="phone-screen"><span>VELOURA</span><img src="https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=700&q=92" alt="Veloura mobile shopping" /><b>NEW DROP</b><small>Women’s party edit</small></div></div></div>
      </section>
    </>
  )
}

function LoadingRail() {
  return <section className="rail-section container"><div className="section-heading marketplace-heading"><div><span className="eyebrow">HOT RIGHT NOW</span><h2>Trending now</h2></div></div><div className="product-rail">{Array.from({ length: 6 }).map((_, index) => <div key={index} className="skeleton product-skeleton" />)}</div></section>
}
