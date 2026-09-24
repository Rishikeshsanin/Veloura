import { Search, Truck } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useShop } from '../store/ShopContext'

export default function TrackOrderPage() {
  const { orders } = useShop()
  const navigate = useNavigate()
  const [id,setId] = useState('')
  const [error,setError] = useState('')

  const submit=(event:FormEvent)=>{
    event.preventDefault()
    const normalized=id.trim().toUpperCase()
    const match=orders.find((order)=>order.id.toUpperCase()===normalized)
    if(!match){setError('That order is not stored on this device.');return}
    setError('')
    navigate('/order/' + match.id)
  }

  return <div className="container track-order-page"><section className="track-order-card"><Truck size={28}/><span className="eyebrow">ORDER TRACKING</span><h1>Where’s my order?</h1><p>Enter a Veloura order ID created on this device.</p><form onSubmit={submit}><div><Search size={17}/><input value={id} onChange={(e)=>setId(e.target.value)} placeholder="VL…" required/><button className="button primary">Track order</button></div>{error&&<span className="form-error">{error}</span>}</form>{orders.length>0&&<small>Tip: your latest order is <button onClick={()=>setId(orders[0].id)}>{orders[0].id}</button>.</small>}</section></div>
}
