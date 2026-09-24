import { Bell, Heart, RefreshCw, ShoppingBag, TrendingDown } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import ProductCard from '../components/ProductCard'
import { fetchCategoryCatalog, fetchProduct } from '../lib/api'
import { defaultProductSize } from '../lib/sizing'
import { getProductPricing } from '../lib/money'
import { useShop } from '../store/ShopContext'
import type { Product } from '../types'

type LiveEntry = {
  saved: Product
  current: Product
  refreshed: boolean
  priceDrop: number
  backInStock: boolean
  soldOutNow: boolean
}

async function refreshProduct(saved: Product) {
  try {
    const direct=await fetchProduct(saved.id)
    if(direct && direct.category===saved.category)return direct
    const category=await fetchCategoryCatalog(saved.category)
    return category.find((item)=>item.id===saved.id) ?? saved
  } catch {
    return saved
  }
}

export default function WishlistPage() {
  const { wishlist, addToCart } = useShop()
  const [live,setLive] = useState<Map<number,Product>>(new Map())
  const [refreshing,setRefreshing] = useState(false)

  const refresh=async()=>{
    if(!wishlist.length){setLive(new Map());return}
    setRefreshing(true)
    const rows=await Promise.all(wishlist.map(async(saved)=>[saved.id,await refreshProduct(saved)] as const))
    setLive(new Map(rows))
    setRefreshing(false)
  }

  useEffect(()=>{refresh().catch(()=>setRefreshing(false))},[wishlist.map((item)=>item.id).join(',')])

  const entries=useMemo<LiveEntry[]>(()=>wishlist.map((saved)=>{
    const current=live.get(saved.id) ?? saved
    const savedPrice=getProductPricing(saved).selling
    const currentPrice=getProductPricing(current).selling
    return {
      saved,
      current,
      refreshed: live.has(saved.id),
      priceDrop: Math.max(0,savedPrice-currentPrice),
      backInStock: saved.stock===0 && current.stock!==0,
      soldOutNow: saved.stock!==0 && current.stock===0,
    }
  }),[wishlist,live])

  const priceDrops=entries.filter((entry)=>entry.priceDrop>0)
  const backInStock=entries.filter((entry)=>entry.backInStock)
  const available=entries.filter((entry)=>entry.current.stock!==0)

  const addAvailable=()=>{
    available.forEach(({current})=>addToCart(current,defaultProductSize(current)))
  }

  return <div className="container wishlist-page">
    <div className="page-title wishlist-title-row"><div><span className="eyebrow">SAVED FOR LATER</span><h1>Your wishlist</h1><p>{wishlist.length ? `${wishlist.length} favourite${wishlist.length === 1 ? '' : 's'}, watched against the live catalog.` : 'Keep the pieces you love in one place.'}</p></div>{wishlist.length>0&&<button className="button outline wishlist-refresh" disabled={refreshing} onClick={()=>refresh()}><RefreshCw size={15}/>{refreshing?'Refreshing…':'Refresh availability'}</button>}</div>

    {wishlist.length>0&&<section className="wishlist-intelligence">
      <div><TrendingDown/><span><strong>{priceDrops.length}</strong><small>price {priceDrops.length===1?'drop':'drops'}</small></span></div>
      <div><Bell/><span><strong>{backInStock.length}</strong><small>back in stock</small></span></div>
      <div><ShoppingBag/><span><strong>{available.length}</strong><small>available now</small></span></div>
      <button disabled={!available.length} onClick={addAvailable}>Add available items to bag</button>
    </section>}

    {wishlist.length ? <div className="wishlist-live-grid">{entries.map((entry)=><article className="wishlist-live-item" key={entry.saved.id}>
      <ProductCard product={entry.current}/>
      <div className="wishlist-statuses">
        {entry.priceDrop>0&&<span className="price-drop"><TrendingDown size={12}/> Price dropped by ₹{entry.priceDrop.toLocaleString('en-IN')}</span>}
        {entry.backInStock&&<span className="back-stock"><Bell size={12}/> Back in stock</span>}
        {entry.soldOutNow&&<span className="sold-now">Currently sold out</span>}
        {!entry.priceDrop&&!entry.backInStock&&!entry.soldOutNow&&entry.refreshed&&<span className="current-state">Live catalog checked</span>}
        {!entry.refreshed&&<span className="current-state">Showing last saved details</span>}
      </div>
    </article>)}</div> : <div className="empty-state standalone"><Heart size={40} /><h2>No favourites yet</h2><p>Tap the heart on any product and it will stay here.</p><Link className="button primary" to="/shop">Discover pieces</Link></div>}
  </div>
}
