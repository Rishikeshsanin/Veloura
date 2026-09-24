import { Bookmark, Heart, Minus, Plus, ShieldCheck, ShoppingBag, Truck, X } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { FREE_DELIVERY_THRESHOLD, totalsFor } from '../lib/commerce'
import { formatINR, getProductPricing } from '../lib/money'
import { useShop } from '../store/ShopContext'

export default function CartPage() {
  const { cart, subtotal, savedForLater, updateQuantity, removeFromCart, toggleWishlist, isWishlisted, saveForLater, moveSavedToCart, removeSaved, coupon, applyCoupon, removeCoupon } = useShop()
  const [couponInput,setCouponInput] = useState(coupon?.ok ? coupon.code : '')
  const [couponError,setCouponError] = useState('')
  const totals = totalsFor(subtotal,coupon)
  const mrpTotal = cart.reduce((sum,item) => sum + getProductPricing(item.product).mrp * item.quantity,0)
  const savings = Math.max(0,mrpTotal-subtotal) + totals.discount
  const freeShippingRemaining = Math.max(0, FREE_DELIVERY_THRESHOLD - Math.max(0,subtotal-totals.discount))
  const shippingProgress = Math.min(100, ((Math.max(0,subtotal-totals.discount))/FREE_DELIVERY_THRESHOLD)*100)

  const submitCoupon=()=>{
    const result=applyCoupon(couponInput)
    setCouponError(result.ok?'':result.message)
    if(result.ok)setCouponInput(result.code)
  }

  if (!cart.length && !savedForLater.length) return <div className="empty-state standalone"><h2>Your bag is empty</h2><p>There are a lot of women’s styles waiting for you.</p><Link className="button primary" to="/shop">Start shopping</Link></div>

  return <div className="container cart-page">
    <div className="page-title"><span className="eyebrow">YOUR SELECTION</span><h1>Shopping bag</h1><p>{cart.reduce((sum,item)=>sum+item.quantity,0)} item{cart.reduce((sum,item)=>sum+item.quantity,0)===1?'':'s'} ready for checkout.</p></div>

    {cart.length > 0 && <div className="free-shipping-meter"><div><Truck size={17}/><span>{freeShippingRemaining>0?<>Add <strong>{formatINR(freeShippingRemaining)}</strong> more for free delivery.</>:<strong>Free delivery unlocked.</strong>}</span></div><i><b style={{width:shippingProgress+'%'}}/></i></div>}

    <div className="cart-layout"><div>
      {cart.length > 0 && <section className="cart-list">{cart.map((item) => { const pricing=getProductPricing(item.product); return <article className="cart-item" key={item.product.id + '-' + item.size}><Link to={'/product/'+item.product.id+'?category='+encodeURIComponent(item.product.category)}><img src={item.product.thumbnail} alt={item.product.title}/></Link><div className="cart-item-copy"><div><strong className="cart-brand">{item.product.brand || 'Veloura Edit'}</strong><Link to={'/product/'+item.product.id+'?category='+encodeURIComponent(item.product.category)}><h3>{item.product.title}</h3></Link><span>Size: {item.size}</span>{item.product.stock===0&&<span className="cart-stock-warning">Currently sold out</span>}</div><div className="price-line"><strong>{formatINR(pricing.selling)}</strong>{pricing.discount>0&&<><s>{formatINR(pricing.mrp)}</s><span>{pricing.discount}% off</span></>}</div><div className="cart-item-actions"><div className="quantity"><button onClick={() => updateQuantity(item.product.id,item.size,item.quantity-1)}><Minus size={14}/></button><span>{item.quantity}</span><button disabled={item.product.stock===0} onClick={() => updateQuantity(item.product.id,item.size,item.quantity+1)}><Plus size={14}/></button></div><button className="text-link" onClick={() => saveForLater(item.product.id,item.size)}><Bookmark size={15}/> Save for later</button><button className="text-link" onClick={() => { if(!isWishlisted(item.product.id)) toggleWishlist(item.product); removeFromCart(item.product.id,item.size) }}><Heart size={15}/> Move to wishlist</button><button className="text-link danger" onClick={() => removeFromCart(item.product.id,item.size)}>Remove</button></div></div></article>})}</section>}

      {savedForLater.length > 0 && <section className="saved-for-later"><div className="saved-head"><div><span className="eyebrow">NOT READY YET?</span><h2>Saved for later</h2></div><span>{savedForLater.length} saved</span></div><div className="saved-grid">{savedForLater.map((item)=>{const price=getProductPricing(item.product);return <article key={item.product.id+'-'+item.size}><Link to={'/product/'+item.product.id+'?category='+encodeURIComponent(item.product.category)}><img src={item.product.thumbnail} alt={item.product.title}/></Link><div><strong>{item.product.brand||'Veloura Edit'}</strong><Link to={'/product/'+item.product.id+'?category='+encodeURIComponent(item.product.category)}>{item.product.title}</Link><span>{formatINR(price.selling)} · Size {item.size}</span></div><div className="saved-actions"><button disabled={item.product.stock===0} onClick={()=>moveSavedToCart(item.product.id,item.size)}><ShoppingBag size={14}/> {item.product.stock===0?'Sold out':'Move to bag'}</button><button aria-label="Remove saved item" onClick={()=>removeSaved(item.product.id,item.size)}><X size={15}/></button></div></article>})}</div></section>}
    </div>

    {cart.length > 0 && <aside className="order-summary"><h2>Price details</h2><div><span>Total MRP</span><b>{formatINR(mrpTotal)}</b></div><div className="saving"><span>Product discounts</span><b>- {formatINR(Math.max(0,mrpTotal-subtotal))}</b></div>{totals.discount>0&&<div className="saving"><span>{coupon?.ok?coupon.code:'Coupon'}</span><b>- {formatINR(totals.discount)}</b></div>}<div><span>Delivery</span><b>{totals.delivery ? formatINR(totals.delivery) : 'FREE'}</b></div><div className="summary-total"><span>Total amount</span><b>{formatINR(totals.total)}</b></div>{savings>0&&<p className="bag-savings">You’re saving {formatINR(savings)} on this bag.</p>}

      {coupon?.ok ? <div className="applied-coupon"><div><strong>{coupon.code}</strong><span>{coupon.label}</span></div><button onClick={()=>{removeCoupon();setCouponInput('')}}>Remove</button></div> : <><div className="promo-input"><input value={couponInput} onChange={(e)=>{setCouponInput(e.target.value.toUpperCase());setCouponError('')}} placeholder="Coupon code"/><button onClick={submitCoupon}>APPLY</button></div>{couponError&&<p className="coupon-error">{couponError}</p>}<div className="coupon-suggestions"><button onClick={()=>setCouponInput('HELLOVELOURA')}>HELLOVELOURA <small>First order</small></button><button onClick={()=>setCouponInput('SAVE300')}>SAVE300 <small>₹1,999+</small></button></div></>}

      <Link className="button primary full" to="/checkout">Proceed to checkout · {formatINR(totals.total)}</Link><p className="secure-note"><ShieldCheck size={15}/> Checkout stores the order record locally; payment processing is still sandboxed.</p>
    </aside>}
    </div>
  </div>
}
