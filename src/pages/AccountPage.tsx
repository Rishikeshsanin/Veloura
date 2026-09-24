import { Heart, MapPin, PackageCheck, Sparkles, Truck, UserRound } from 'lucide-react'
import { Link } from 'react-router-dom'
import { categoryLabel } from '../data/catalog'
import { topPreference } from '../lib/personalization'
import { useShop } from '../store/ShopContext'

export default function AccountPage() {
  const { wishlist, recentlyViewed, preferenceSignals, resetPreferences, orders, addresses, removeAddress, setDefaultAddress } = useShop()
  const favoriteCategory = topPreference(preferenceSignals, 'categories')
  const favoriteBrand = topPreference(preferenceSignals, 'brands')
  const favoriteColor = topPreference(preferenceSignals, 'colors')
  const hasProfile = Boolean(favoriteCategory || favoriteBrand || favoriteColor)

  return <div className="container account-page">
    <div className="account-hero"><div className="avatar"><UserRound /></div><div><span className="eyebrow">MY VELOURA</span><h1>Your shopping space</h1><p>Wishlist, orders, addresses, recent browsing and style signals are saved on this device while the account-sync backend is being activated.</p></div></div>

    <div className="account-grid">
      <Link to="/wishlist"><Heart /><span><strong>Wishlist</strong><small>{wishlist.length ? wishlist.length + ' saved styles' : 'Save pieces for later'}</small></span></Link>
      <Link to="/orders"><PackageCheck /><span><strong>Orders</strong><small>{orders.length ? orders.length + ' order' + (orders.length===1?'':'s') : 'No orders yet'}</small></span></Link>
      <a href="#addresses"><MapPin /><span><strong>Addresses</strong><small>{addresses.length ? addresses.length + ' saved' : 'Save one at checkout'}</small></span></a>
      <Link to="/track-order"><Truck/><span><strong>Track order</strong><small>Find an order by ID</small></span></Link>
    </div>

    {orders.length > 0 && <section className="account-panel">
      <div className="account-panel-title"><div><span className="eyebrow">ORDER HISTORY</span><h2>Recent orders</h2></div><Link to="/orders">View all →</Link></div>
      <div className="account-order-list">{orders.slice(0,3).map((order)=><Link key={order.id} to={'/order/'+order.id}><span><strong>{order.id}</strong><small>{new Date(order.createdAt).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})} · {order.items.reduce((sum,item)=>sum+item.quantity,0)} items</small></span><b>Open →</b></Link>)}</div>
    </section>}

    <section className="account-panel" id="addresses">
      <div className="account-panel-title"><div><span className="eyebrow">DELIVERY</span><h2>Saved addresses</h2></div><Link to="/checkout">Add at checkout →</Link></div>
      {addresses.length ? <div className="account-addresses">{addresses.map((address)=><article key={address.id} className={address.isDefault?'default':''}><div><strong>{address.label}{address.isDefault?' · Default':''}</strong><span>{address.firstName} {address.lastName}</span><p>{address.line1}{address.line2?', '+address.line2:''}<br/>{address.city}, {address.state} {address.pincode}<br/>{address.phone}</p></div><div>{!address.isDefault&&<button onClick={()=>setDefaultAddress(address.id)}>Make default</button>}<button className="danger" onClick={()=>removeAddress(address.id)}>Remove</button></div></article>)}</div> : <p className="account-muted">No saved address yet. You can save one securely on this device during checkout.</p>}
    </section>

    <section className="account-panel style-account-panel">
      <div className="account-panel-title"><div><span className="eyebrow">PERSONALIZATION</span><h2>Your style signals</h2></div><Sparkles size={22}/></div>
      {hasProfile ? <div className="account-style-signals">
        {favoriteCategory && <div><span>Most explored</span><strong>{categoryLabel(favoriteCategory)}</strong></div>}
        {favoriteBrand && <div><span>Brand signal</span><strong>{favoriteBrand}</strong></div>}
        {favoriteColor && <div><span>Colour signal</span><strong>{favoriteColor}</strong></div>}
        <div><span>Recently viewed</span><strong>{recentlyViewed.length} styles</strong></div>
      </div> : <p className="account-muted">Browse, save or add a few products and Veloura will start shaping recommendations around the categories and brands you interact with.</p>}
      <div className="account-privacy-note"><strong>Stored locally</strong><span>Style signals stay in this browser. Resetting them does not delete your bag, wishlist, orders, addresses or recently viewed products.</span></div>
      {hasProfile && <button className="button ghost" onClick={resetPreferences}>Reset style preferences</button>}
    </section>

    <section className="account-panel"><h2>Shopping support</h2><div><span>Returns</span><Link to="/help/returns">View policy →</Link></div><div><span>Size guide</span><Link to="/help/size-guide">Find your fit →</Link></div><div><span>Help</span><Link to="/help/faq">Visit help centre →</Link></div></section>
  </div>
}
