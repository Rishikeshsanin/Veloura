import { Check, CreditCard, ShieldCheck, Smartphone, Truck } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { formatINR } from '../lib/money'
import { useShop } from '../store/ShopContext'

export default function CheckoutPage() {
  const { cart, subtotal, clearCart } = useShop()
  const [payment, setPayment] = useState<'card'|'upi'|'cod'>('upi')
  const [done, setDone] = useState(false)
  const delivery = subtotal >= 1499 ? 0 : 99

  const submit = (e: FormEvent) => {
    e.preventDefault()
    setDone(true)
    clearCart()
    window.scrollTo({top:0,behavior:'smooth'})
  }

  if (done) return <div className="order-success container"><div className="success-check"><Check/></div><span className="eyebrow">ORDER CONFIRMED</span><h1>That look is yours.</h1><p>Your demo order <b>#VL{Math.floor(100000 + Math.random()*899999)}</b> has been placed. A production store would send confirmation and tracking now.</p><Link className="button primary" to="/shop">Keep shopping</Link></div>
  if (!cart.length) return <div className="empty-state standalone"><h2>Nothing to checkout yet</h2><p>Add something you love first.</p><Link className="button primary" to="/shop">Shop women</Link></div>

  return <div className="container checkout-page"><div className="checkout-head"><div><span className="eyebrow">SECURE CHECKOUT</span><h1>Almost yours</h1></div><ShieldCheck/></div><div className="checkout-layout"><form onSubmit={submit} className="checkout-form"><section><h2><span>01</span> Contact</h2><div className="form-grid"><label className="wide">Email<input type="email" required placeholder="you@example.com"/></label><label className="wide">Phone<input required inputMode="tel" placeholder="98765 43210"/></label></div></section><section><h2><span>02</span> Delivery address</h2><div className="form-grid"><label>First name<input required/></label><label>Last name<input required/></label><label className="wide">Address<input required placeholder="House / flat / street"/></label><label>City<input required/></label><label>State<input required/></label><label>Pincode<input required inputMode="numeric"/></label><label>Country<input value="India" readOnly/></label></div></section><section><h2><span>03</span> Payment</h2><div className="payment-tabs"><button type="button" className={payment==='upi'?'active':''} onClick={() => setPayment('upi')}><Smartphone/> UPI</button><button type="button" className={payment==='card'?'active':''} onClick={() => setPayment('card')}><CreditCard/> Card</button><button type="button" className={payment==='cod'?'active':''} onClick={() => setPayment('cod')}><Truck/> COD</button></div>{payment==='upi'&&<div className="payment-panel"><label>UPI ID<input required placeholder="name@bank"/></label><p>Demo only — no payment request is sent.</p></div>}{payment==='card'&&<div className="payment-panel form-grid"><label className="wide">Card number<input required placeholder="4242 4242 4242 4242"/></label><label>Expiry<input required placeholder="MM / YY"/></label><label>CVC<input required placeholder="123"/></label><p className="wide">Demo fields only — card data is never processed or stored.</p></div>}{payment==='cod'&&<div className="payment-panel"><p>Pay on delivery. This is still a demo order and no real shipment is created.</p></div>}<button className="button primary full checkout-submit">Place demo order · {formatINR(subtotal+delivery)}</button></section></form><aside className="order-summary checkout-summary"><h2>Your order</h2>{cart.map((item) => <div className="checkout-item" key={`${item.product.id}-${item.size}`}><img src={item.product.thumbnail} alt=""/><div><strong>{item.product.title}</strong><span>Size {item.size} · Qty {item.quantity}</span></div></div>)}<div><span>Subtotal</span><b>{formatINR(subtotal)}</b></div><div><span>Delivery</span><b>{delivery?formatINR(delivery):'FREE'}</b></div><div className="summary-total"><span>Total</span><b>{formatINR(subtotal+delivery)}</b></div></aside></div></div>
}
