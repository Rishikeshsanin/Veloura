import { ArrowRight, PackageCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import { formatINR } from '../lib/money'
import { ORDER_STATUS_META } from '../lib/commerce'
import { useShop } from '../store/ShopContext'

export default function OrdersPage() {
  const { orders } = useShop()

  return <div className="container orders-page">
    <div className="page-title"><span className="eyebrow">MY VELOURA</span><h1>Orders</h1><p>Every order placed on this device is kept here for tracking and support.</p></div>
    {!orders.length ? <div className="empty-state standalone"><span className="empty-mark">V</span><h2>No orders yet</h2><p>Your first Veloura order will appear here after checkout.</p><Link className="button primary" to="/shop">Start shopping</Link></div> :
    <div className="orders-list">{orders.map((order) => <Link className="order-card" key={order.id} to={'/order/' + order.id}>
      <div className="order-card-icon"><PackageCheck/></div>
      <div className="order-card-main"><span>{new Date(order.createdAt).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}</span><strong>{order.id}</strong><small>{order.items.reduce((sum,item)=>sum+item.quantity,0)} item{order.items.reduce((sum,item)=>sum+item.quantity,0)===1?'':'s'} · {ORDER_STATUS_META[order.status].label}</small></div>
      <div className="order-card-total"><strong>{formatINR(order.total)}</strong><ArrowRight size={17}/></div>
    </Link>)}</div>}
  </div>
}
