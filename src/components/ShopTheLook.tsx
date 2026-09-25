import { ArrowRight, ShoppingBag, Sparkles } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { formatINR, getProductPricing } from '../lib/money'
import { defaultProductSize } from '../lib/sizing'
import { useShop } from '../store/ShopContext'
import type { Product } from '../types'
import ResponsiveImage from './ResponsiveImage'

type LookConfig = { name: string; note: string; categories: string[]; href: string }
type BuiltLook = LookConfig & { products: Product[] }

const LOOKS: LookConfig[] = [
  { name: 'After dark', note: 'Dress + heels + finishing bag', categories: ['womens-dresses','womens-shoes','womens-bags'], href: '/edit/after-dark' },
  { name: 'Soft tailoring', note: 'Polished separates + carryall', categories: ['womens-tops','womens-bottoms','womens-bags'], href: '/edit/soft-tailoring' },
  { name: 'Modern festive', note: 'Ethnic statement + jewellery + bag', categories: ['womens-ethnicwear','womens-jewellery','womens-bags'], href: '/edit/modern-festive' },
]

function productScore(product: Product) {
  return (product.rating ?? 4) * 5 + Math.min(product.images?.length ?? 0, 5) * 2 + (product.stock === 0 ? -20 : 1)
}

export default function ShopTheLook({ products }: { products: Product[] }) {
  const { addToCart } = useShop()
  const looks = useMemo<BuiltLook[]>(() => LOOKS.map((look) => ({
    ...look,
    products: look.categories.map((category) => [...products]
      .filter((product) => product.category === category && product.stock !== 0)
      .sort((a,b) => productScore(b) - productScore(a))[0])
      .filter((product): product is Product => Boolean(product)),
  })).filter((look) => look.products.length === look.categories.length), [products])
  const [activeIndex, setActiveIndex] = useState(0)

  if (!looks.length) return null
  const active = looks[Math.min(activeIndex, looks.length - 1)]

  const addLook = () => active.products.forEach((product) => addToCart(product, defaultProductSize(product)))

  return <section className="shop-look-section container-wide">
    <div className="shop-look-heading">
      <div><span className="eyebrow">STYLE IT FOR ME</span><h2>Shop the look</h2><p>Complete outfits assembled from products that are actually live in the Veloura catalog.</p></div>
      <div className="look-tabs">{looks.map((look,index) => <button className={index === activeIndex ? 'active' : ''} key={look.name} onClick={() => setActiveIndex(index)}>{look.name}</button>)}</div>
    </div>

    <div className="look-stage" key={active.name}>
      <div className="look-visuals">
        {active.products.map((product,index) => <Link className={`look-visual look-visual-${index}`} key={product.id} to={`/product/${product.id}?category=${encodeURIComponent(product.category)}`}>
          <ResponsiveImage src={product.images?.[0] || product.thumbnail} sizes="(max-width: 760px) 72vw, 24vw" alt={product.title} loading="lazy" decoding="async"/>
          <span>{index + 1}</span>
        </Link>)}
        <div className="look-monogram" aria-hidden="true">V</div>
      </div>

      <div className="look-copy">
        <span className="eyebrow">VELOURA STYLING DESK</span>
        <h3>{active.name}</h3>
        <p>{active.note}. Use the pieces together or treat the edit as a starting point.</p>
        <div className="look-product-list">
          {active.products.map((product,index) => {
            const price = getProductPricing(product)
            return <Link key={product.id} to={`/product/${product.id}?category=${encodeURIComponent(product.category)}`}>
              <b>{String(index + 1).padStart(2,'0')}</b><span><small>{product.brand || 'Veloura Edit'}</small><strong>{product.title}</strong></span><em>{formatINR(price.selling)}</em><ArrowRight size={14}/>
            </Link>
          })}
        </div>
        <div className="look-actions"><button className="button primary" onClick={addLook}><ShoppingBag size={16}/> Add complete look</button><Link className="button outline" to={active.href}><Sparkles size={15}/> Explore the edit</Link></div>
      </div>
    </div>
  </section>
}
