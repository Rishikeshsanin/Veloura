import { ArrowLeft, Check, Copy, MapPin, PackageCheck, Truck } from 'lucide-react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { formatINR, getProductPricing } from '../lib/money'
import { ORDER_STATUS_META, orderTimeline } from '../lib/commerce'
import { useShop } from '../store/ShopContext'

export default function OrderDetailPage() {
  const { orderId = '' } = useParams()
  const [params] = useSearchParams()
  const { orders, cancelOrder } = useShop()
  const order = orders.find((item) => item.id === orderId)

  if (!order) return <div className="empty-state standalone"><h2>Order not found</h2><p>This order is not stored on this device.</p><Link className="button primary" to="/orders">View orders</Link></div>

  const justPlaced = params.get('placed') === '1'
  const timeline = orderTimeline(order)

  return <div className="container order-detail-page">
    <Link className="order-back" to="/orders"><ArrowLeft size={15}/> All orders</Link>

    {justPlaced && <section className="order-confirmed-banner"><div><Check/></div><span className="eyebrow">ORDER PLACED</span><h1>That look is yours.</h1><p>Your order record is saved. Payment and fulfilment remain in sandbox mode until the production backend and payment provider are activated.</p></section>}

    <div className="order-detail-head"><div><span className="eyebrow">ORDER</span><h1>{order.id}</h1><p>Placed {new Date(order.createdAt).toLocaleString('en-IN',{day:'numeric',month:'short',year:'numeric',hour:'numeric',minute:'2-digit'})}</p></div><div className="order-head-actions"><button className="button outline" onClick={() => navigator.clipboard?.writeText(order.id)}><Copy size={15}/> Copy ID</button>{['placed','confirmed'].includes(order.status)&&<button className="button ghost danger-button" onClick={()=>cancelOrder(order.id)}>Cancel order</button>}</div></div>

    <div className="order-detail-layout"><div>
      <section className="order-panel"><div className="order-panel-title"><PackageCheck/><div><span>Current status</span><strong>{ORDER_STATUS_META[order.status].label}</strong></div></div><div className="order-timeline">{timeline.map((step,index)=><div key={step.status} className={step.reached?'reached':''}><i>{step.reached?<Check size={12}/>:index+1}</i><div><strong>{step.label}</strong><span>{step.reached?'Recorded':'Sandbox projection'} · {new Date(step.expectedAt).toLocaleString('en-IN',{day:'numeric',month:'short',hour:'numeric',minute:'2-digit'})}</span><small>{step.detail}</small></div></div>)}</div></section>

      <section className="order-panel"><h2>Items</h2><div className="order-items">{order.items.map((item)=>{const pricing=getProductPricing(item.product);return <Link key={item.product.id + '-' + item.size} to={'/product/' + item.product.id + '?category=' + encodeURIComponent(item.product.category)}><img src={item.product.thumbnail} alt=""/><div><strong>{item.product.title}</strong><span>{item.product.brand || 'Veloura selection'} · Size {item.size} · Qty {item.quantity}</span></div><b>{formatINR(pricing.selling * item.quantity)}</b></Link>})}</div></section>
    </div>

    <aside>
      <section className="order-panel"><h2>Delivery</h2><p className="order-address"><MapPin size={16}/><span><strong>{order.address.firstName} {order.address.lastName}</strong>{order.address.line1}{order.address.line2 ? ', ' + order.address.line2 : ''}<br/>{order.address.city}, {order.address.state} {order.address.pincode}<br/>{order.address.phone}</span></p></section>
      <section className="order-panel order-payment"><h2>Payment</h2><div><span>Method</span><b>{order.paymentMethod.toUpperCase()}</b></div><div><span>Subtotal</span><b>{formatINR(order.subtotal)}</b></div>{order.discount>0&&<div className="saving"><span>Discount {order.couponCode ? '(' + order.couponCode + ')' : ''}</span><b>- {formatINR(order.discount)}</b></div>}<div><span>Delivery</span><b>{order.delivery?formatINR(order.delivery):'FREE'}</b></div><div className="summary-total"><span>Total</span><b>{formatINR(order.total)}</b></div></section>
      <section className="order-panel order-support"><Truck/><div><strong>Need help with this order?</strong><p>Use the order ID when contacting support.</p><Link to="/help/contact">Contact Veloura →</Link></div></section>
    </aside></div>
  </div>
}
