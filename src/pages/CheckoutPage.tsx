import { CreditCard, MapPin, ShieldCheck, Smartphone, Truck } from 'lucide-react'
import { useMemo, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { createAddressId, totalsFor, type Address, type PaymentMethod } from '../lib/commerce'
import { formatINR } from '../lib/money'
import { useShop } from '../store/ShopContext'

export default function CheckoutPage() {
  const { cart, subtotal, coupon, addresses, addAddress, placeOrder } = useShop()
  const navigate = useNavigate()
  const defaultAddress = useMemo(() => addresses.find((item) => item.isDefault) || addresses[0], [addresses])
  const [payment, setPayment] = useState<PaymentMethod>('upi')
  const [addressMode, setAddressMode] = useState<'saved'|'new'>(defaultAddress ? 'saved' : 'new')
  const [selectedAddressId, setSelectedAddressId] = useState(defaultAddress?.id || '')
  const [saveAddress, setSaveAddress] = useState(true)
  const totals = totalsFor(subtotal, coupon)

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    let address: Address | undefined

    if (addressMode === 'saved') {
      address = addresses.find((item) => item.id === selectedAddressId)
    } else {
      const input = {
        label: String(form.get('label') || 'Home'),
        firstName: String(form.get('firstName') || '').trim(),
        lastName: String(form.get('lastName') || '').trim(),
        email: String(form.get('email') || '').trim(),
        phone: String(form.get('phone') || '').trim(),
        line1: String(form.get('line1') || '').trim(),
        line2: String(form.get('line2') || '').trim(),
        city: String(form.get('city') || '').trim(),
        state: String(form.get('state') || '').trim(),
        pincode: String(form.get('pincode') || '').trim(),
        country: 'India',
      }
      address = saveAddress
        ? addAddress({ ...input, isDefault: addresses.length === 0 })
        : { ...input, id: createAddressId(), createdAt: new Date().toISOString(), isDefault: false }
    }

    if (!address) return
    const order = placeOrder(address, payment)
    if (!order) return
    navigate('/order/' + order.id + '?placed=1')
  }

  if (!cart.length) return <div className="empty-state standalone"><h2>Nothing to checkout yet</h2><p>Add something you love first.</p><a className="button primary" href="/shop">Shop women</a></div>

  return <div className="container checkout-page">
    <div className="checkout-head"><div><span className="eyebrow">SECURE CHECKOUT</span><h1>Almost yours</h1><p>Your order record will be saved immediately after checkout.</p></div><ShieldCheck/></div>

    <div className="checkout-layout"><form onSubmit={submit} className="checkout-form">
      <section><h2><span>01</span> Delivery address</h2>
        {addresses.length > 0 && <div className="checkout-address-tabs"><button type="button" className={addressMode==='saved'?'active':''} onClick={()=>setAddressMode('saved')}><MapPin size={16}/> Saved addresses</button><button type="button" className={addressMode==='new'?'active':''} onClick={()=>setAddressMode('new')}>Use a new address</button></div>}

        {addressMode === 'saved' && addresses.length > 0 ? <div className="checkout-address-list">{addresses.map((address)=><label className={selectedAddressId===address.id?'active':''} key={address.id}><input type="radio" name="savedAddress" checked={selectedAddressId===address.id} onChange={()=>setSelectedAddressId(address.id)}/><span><b>{address.label}{address.isDefault?' · Default':''}</b><strong>{address.firstName} {address.lastName}</strong><small>{address.line1}{address.line2?', '+address.line2:''}, {address.city}, {address.state} {address.pincode}</small><small>{address.phone} · {address.email}</small></span></label>)}</div> :
        <div className="form-grid"><label>First name<input name="firstName" required/></label><label>Last name<input name="lastName" required/></label><label className="wide">Email<input name="email" type="email" required placeholder="you@example.com"/></label><label className="wide">Phone<input name="phone" required inputMode="tel" placeholder="98765 43210"/></label><label className="wide">Address<input name="line1" required placeholder="House / flat / street"/></label><label className="wide">Landmark / area<input name="line2" placeholder="Optional"/></label><label>City<input name="city" required/></label><label>State<input name="state" required/></label><label>Pincode<input name="pincode" required inputMode="numeric" pattern="[0-9]{6}" maxLength={6}/></label><label>Label<select name="label" defaultValue="Home"><option>Home</option><option>Work</option><option>Other</option></select></label><label className="wide checkout-save-address"><input type="checkbox" checked={saveAddress} onChange={(e)=>setSaveAddress(e.target.checked)}/> Save this address on this device</label></div>}
      </section>

      <section><h2><span>02</span> Payment</h2><div className="payment-tabs"><button type="button" className={payment==='upi'?'active':''} onClick={() => setPayment('upi')}><Smartphone/> UPI</button><button type="button" className={payment==='card'?'active':''} onClick={() => setPayment('card')}><CreditCard/> Card</button><button type="button" className={payment==='cod'?'active':''} onClick={() => setPayment('cod')}><Truck/> COD</button></div>
        {payment==='upi'&&<div className="payment-panel"><label>UPI ID<input name="upi" required placeholder="name@bank"/></label><p>Sandbox payment only — no payment request is sent yet.</p></div>}
        {payment==='card'&&<div className="payment-panel form-grid"><label className="wide">Card number<input name="card" required inputMode="numeric" placeholder="4242 4242 4242 4242"/></label><label>Expiry<input name="expiry" required placeholder="MM / YY"/></label><label>CVC<input name="cvc" required placeholder="123"/></label><p className="wide">Sandbox fields only. Card data is never stored by Veloura.</p></div>}
        {payment==='cod'&&<div className="payment-panel"><p>Cash on delivery is recorded as the selected method. No real shipment is created until fulfilment backend activation.</p></div>}
        <button className="button primary full checkout-submit">Place order · {formatINR(totals.total)}</button>
      </section>
    </form>

    <aside className="order-summary checkout-summary"><h2>Your order</h2>{cart.map((item) => <div className="checkout-item" key={item.product.id + '-' + item.size}><img src={item.product.thumbnail} alt=""/><div><strong>{item.product.title}</strong><span>Size {item.size} · Qty {item.quantity}</span></div></div>)}<div><span>Subtotal</span><b>{formatINR(totals.subtotal)}</b></div>{totals.discount>0&&<div className="saving"><span>Coupon {coupon?.ok?coupon.code:''}</span><b>- {formatINR(totals.discount)}</b></div>}<div><span>Delivery</span><b>{totals.delivery?formatINR(totals.delivery):'FREE'}</b></div><div className="summary-total"><span>Total</span><b>{formatINR(totals.total)}</b></div><p className="secure-note"><ShieldCheck size={15}/> Order/address data stays on this device until backend sync is activated.</p></aside>
    </div>
  </div>
}
