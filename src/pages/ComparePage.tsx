import { ArrowLeftRight, Heart, ShoppingBag, X } from 'lucide-react'
import type { CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { categoryLabel } from '../data/catalog'
import { formatINR, getProductPricing } from '../lib/money'
import { defaultProductSize } from '../lib/sizing'
import { useShop } from '../store/ShopContext'

export default function ComparePage(){
  const { compare, toggleCompare, clearCompare, addToCart, toggleWishlist, isWishlisted }=useShop()

  if(compare.length<2) return <div className="empty-state standalone compare-empty"><ArrowLeftRight size={42}/><h2>Add at least two products</h2><p>Use the compare icon on product cards or product pages. Veloura keeps up to four products side by side.</p><Link className="button primary" to="/shop">Browse products</Link></div>

  const rows=[
    {label:'Price',render:(p:any)=>formatINR(getProductPricing(p).selling)},
    {label:'MRP',render:(p:any)=>formatINR(getProductPricing(p).mrp)},
    {label:'Discount',render:(p:any)=>getProductPricing(p).discount?getProductPricing(p).discount+'%':'—'},
    {label:'Brand',render:(p:any)=>p.brand||'Veloura Edit'},
    {label:'Department',render:(p:any)=>categoryLabel(p.category)},
    {label:'Rating',render:(p:any)=>p.rating!==undefined?p.rating.toFixed(1):'Not supplied'},
    {label:'Colour',render:(p:any)=>p.color||'Not supplied'},
    {label:'Sizes',render:(p:any)=>p.sizes?.length?p.sizes.join(', '):'Provider specific'},
    {label:'Availability',render:(p:any)=>p.stock===0?'Sold out':p.stock!==undefined?(p.stock<=15?'Low stock':'In stock'):'Check product'},
    {label:'Source',render:(p:any)=>p.sourceLabel||p.source||'Catalog'},
  ]

  return <div className="container-wide compare-page">
    <div className="page-title compare-title"><div><span className="eyebrow">SIDE BY SIDE</span><h1>Compare styles</h1><p>Compare only the product information actually available in the live catalog.</p></div><button className="button ghost" onClick={clearCompare}>Clear all</button></div>
    <div className="compare-scroll">
      <div className="compare-grid" style={{'--compare-count':compare.length} as CSSProperties}>
        <div className="compare-label-cell compare-product-label">Product</div>
        {compare.map((product)=><article className="compare-product-head" key={product.id}>
          <button aria-label={'Remove '+product.title} onClick={()=>toggleCompare(product)}><X size={15}/></button>
          <Link to={'/product/'+product.id+'?category='+encodeURIComponent(product.category)}><img src={product.thumbnail} alt={product.title}/></Link>
          <strong>{product.brand||'Veloura Edit'}</strong>
          <Link to={'/product/'+product.id+'?category='+encodeURIComponent(product.category)}>{product.title}</Link>
          <div><button disabled={product.stock===0} onClick={()=>addToCart(product,defaultProductSize(product))}><ShoppingBag size={14}/>{product.stock===0?'Sold out':'Add to bag'}</button><button className={isWishlisted(product.id)?'active':''} onClick={()=>toggleWishlist(product)} aria-label="Toggle wishlist"><Heart size={15} fill={isWishlisted(product.id)?'currentColor':'none'}/></button></div>
        </article>)}
        {rows.flatMap((row)=>[
          <div className="compare-label-cell" key={row.label+'-label'}>{row.label}</div>,
          ...compare.map((product)=><div className="compare-value-cell" key={row.label+'-'+product.id}>{row.render(product)}</div>)
        ])}
        <div className="compare-label-cell compare-description-label">About</div>
        {compare.map((product)=><div className="compare-value-cell compare-description" key={'description-'+product.id}>{product.description}</div>)}
      </div>
    </div>
  </div>
}
