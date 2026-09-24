import { ArrowRight, ShoppingBag, Sparkles } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { formatINR, getProductPricing } from '../lib/money'
import { defaultProductSize } from '../lib/sizing'
import { useShop } from '../store/ShopContext'
import type { Product } from '../types'

const DIRECTIONS = [
  { name:'Clean', note:'Quiet pieces, balanced proportions, easy repeat wear.' },
  { name:'Statement', note:'Sharper contrast and a more noticeable finishing piece.' },
  { name:'Off-duty', note:'Relaxed styling for everyday plans and lower-effort dressing.' },
]

function score(product: Product, mode: number) {
  let value=(product.rating ?? 4)*5 + Math.min(product.images?.length ?? 0,5)*2
  if (mode===0) value += (product.discountPercentage ?? 0) < 35 ? 4 : 0
  if (mode===1) value += (product.discountPercentage ?? 0) >= 30 ? 3 : 0
  if (mode===2) value += getProductPricing(product).selling <= 2499 ? 4 : 0
  return value
}

function buildLooks(base: Product, candidates: Product[]) {
  const categoryOrder = [...new Set(candidates.map((product)=>product.category))]
  return DIRECTIONS.map((direction,mode)=>{
    const picked: Product[]=[]
    categoryOrder.forEach((category)=>{
      if (picked.length>=3) return
      const choice=[...candidates].filter((product)=>product.category===category && product.stock!==0 && !picked.some((item)=>item.id===product.id)).sort((a,b)=>score(b,mode)-score(a,mode))[mode] 
        ?? [...candidates].filter((product)=>product.category===category && product.stock!==0 && !picked.some((item)=>item.id===product.id)).sort((a,b)=>score(b,mode)-score(a,mode))[0]
      if(choice) picked.push(choice)
    })
    return {...direction,products:[base,...picked.slice(0,3)]}
  }).filter((look)=>look.products.length>=3)
}

export default function StyleThisPiece({ product, candidates }: { product: Product; candidates: Product[] }) {
  const { addToCart } = useShop()
  const looks=useMemo(()=>buildLooks(product,candidates),[product,candidates])
  const [active,setActive]=useState(0)
  if(!looks.length) return null
  const look=looks[Math.min(active,looks.length-1)]
  const total=look.products.reduce((sum,item)=>sum+getProductPricing(item).selling,0)

  const addLook=()=>look.products.forEach((item)=>addToCart(item,defaultProductSize(item)))

  return <section className="style-piece container-wide">
    <div className="style-piece-head">
      <div><span className="eyebrow">VELOURA STYLING DESK</span><h2>Style this piece</h2><p>Three ways to build around the exact item you’re viewing.</p></div>
      <div className="style-direction-tabs">{looks.map((item,index)=><button key={item.name} className={active===index?'active':''} onClick={()=>setActive(index)}>{item.name}</button>)}</div>
    </div>

    <div className="style-piece-stage" key={look.name}>
      <div className="style-piece-images">
        {look.products.map((item,index)=><Link key={item.id} className={`style-piece-image style-piece-image-${index}`} to={`/product/${item.id}?category=${encodeURIComponent(item.category)}`}>
          <img src={item.images?.[0]||item.thumbnail} alt={item.title} loading="lazy"/>
          <span>{index===0?'THE PIECE':String(index+1).padStart(2,'0')}</span>
        </Link>)}
      </div>
      <div className="style-piece-copy">
        <Sparkles size={18}/>
        <span className="eyebrow">{look.name.toUpperCase()} DIRECTION</span>
        <h3>{look.note}</h3>
        <div className="style-piece-list">
          {look.products.map((item,index)=>{const price=getProductPricing(item);return <Link key={item.id} to={`/product/${item.id}?category=${encodeURIComponent(item.category)}`}><b>{String(index+1).padStart(2,'0')}</b><span><small>{item.brand||'Veloura Edit'}</small><strong>{item.title}</strong></span><em>{formatINR(price.selling)}</em><ArrowRight size={13}/></Link>})}
        </div>
        <div className="style-piece-total"><span>Complete look</span><strong>{formatINR(total)}</strong></div>
        <button className="button primary" onClick={addLook}><ShoppingBag size={16}/> Add this look</button>
      </div>
    </div>
  </section>
}
