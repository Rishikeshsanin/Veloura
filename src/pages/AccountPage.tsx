import { Cloud, Heart, LogOut, MapPin, PackageCheck, RefreshCw, Sparkles, Truck, UserRound } from 'lucide-react'
import { Link } from 'react-router-dom'
import { categoryLabel } from '../data/catalog'
import { topPreference } from '../lib/personalization'
import { useAuth } from '../store/AuthContext'
import { useShop } from '../store/ShopContext'
import NotificationPreferences from '../components/NotificationPreferences'

const syncCopy = {
  local: ['This device','Sign in to sync across devices.'],
  syncing: ['Syncing','Saving your latest Veloura changes…'],
  synced: ['Cloud synced','Your account data is up to date.'],
  error: ['Sync paused','Your local data is safe. Retry cloud sync when ready.'],
} as const

export default function AccountPage() {
  const { user, loading, signOut } = useAuth()
  const { wishlist, recentlyViewed, preferenceSignals, resetPreferences, orders, addresses, removeAddress, setDefaultAddress, cloudStatus, syncNow } = useShop()
  const favoriteCategory = topPreference(preferenceSignals, 'categories')
  const favoriteBrand = topPreference(preferenceSignals, 'brands')
  const favoriteColor = topPreference(preferenceSignals, 'colors')
  const hasProfile = Boolean(favoriteCategory || favoriteBrand || favoriteColor)
  const [syncLabel,syncDetail] = syncCopy[user ? cloudStatus : 'local']
  const displayName = String(user?.user_metadata?.display_name || user?.user_metadata?.full_name || '').trim()

  if (loading) return <div className="page-loader" role="status"><div className="page-loader-mark"><strong>V</strong><span>VELOURA</span><small>ACCOUNT</small></div><div className="page-loader-line"><i/></div></div>

  return <div className="container account-page">
    <div className="account-hero">
      <div className="avatar">{displayName ? displayName.slice(0,1).toUpperCase() : <UserRound />}</div>
      <div><span className="eyebrow">MY VELOURA</span><h1>{user ? (displayName ? `Hi, ${displayName}.` : 'Your shopping space') : 'Your shopping space'}</h1><p>{user ? 'Wishlist, bag, saved pieces, addresses, style signals and sandbox order history can now follow you across devices.' : 'Continue as a guest on this device, or sign in to carry your Veloura shopping space across devices.'}</p></div>
      <div className={'account-sync-state '+cloudStatus}><Cloud size={17}/><span><strong>{syncLabel}</strong><small>{syncDetail}</small></span>{user&&cloudStatus==='error'&&<button onClick={()=>syncNow()}><RefreshCw size={14}/> Retry</button>}</div>
    </div>

    {!user && <section className="account-signin-banner"><div><span className="eyebrow">CROSS-DEVICE VELOURA</span><h2>Keep your edit with you.</h2><p>Sign in or create an account. Anything already in your bag or wishlist will be merged into your account rather than replaced.</p></div><Link className="button primary" to="/login">Sign in / Create account</Link></section>}

    {user && <section className="account-identity-strip"><div><UserRound/><span><strong>{displayName || 'Veloura member'}</strong><small>{user.email}</small></span></div><div><Cloud/><span><strong>{syncLabel}</strong><small>Private Veloura account data</small></span></div><button className="button ghost" onClick={()=>signOut()}><LogOut size={15}/> Sign out</button></section>}

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
      {addresses.length ? <div className="account-addresses">{addresses.map((address)=><article key={address.id} className={address.isDefault?'default':''}><div><strong>{address.label}{address.isDefault?' · Default':''}</strong><span>{address.firstName} {address.lastName}</span><p>{address.line1}{address.line2?', '+address.line2:''}<br/>{address.city}, {address.state} {address.pincode}<br/>{address.phone}</p></div><div>{!address.isDefault&&<button onClick={()=>setDefaultAddress(address.id)}>Make default</button>}<button className="danger" onClick={()=>removeAddress(address.id)}>Remove</button></div></article>)}</div> : <p className="account-muted">No saved address yet. You can save one during checkout.{user?' It will sync with this account.':' Sign in first if you want it across devices.'}</p>}
    </section>

    <NotificationPreferences/>

    <section className="account-panel style-account-panel">
      <div className="account-panel-title"><div><span className="eyebrow">PERSONALIZATION</span><h2>Your style signals</h2></div><Sparkles size={22}/></div>
      {hasProfile ? <div className="account-style-signals">
        {favoriteCategory && <div><span>Most explored</span><strong>{categoryLabel(favoriteCategory)}</strong></div>}
        {favoriteBrand && <div><span>Brand signal</span><strong>{favoriteBrand}</strong></div>}
        {favoriteColor && <div><span>Colour signal</span><strong>{favoriteColor}</strong></div>}
        <div><span>Recently viewed</span><strong>{recentlyViewed.length} styles</strong></div>
      </div> : <p className="account-muted">Browse, save or add a few products and Veloura will start shaping recommendations around the categories and brands you interact with.</p>}
      <div className="account-privacy-note"><strong>{user?'Account scoped':'Stored locally'}</strong><span>{user?'Style signals sync only inside your Veloura account. Row-level security prevents other signed-in users from reading them.':'These style signals stay in this browser until you sign in.'}</span></div>
      {hasProfile && <button className="button ghost" onClick={resetPreferences}>Reset style preferences</button>}
    </section>

    <section className="account-panel"><h2>Shopping support</h2><div><span>Returns</span><Link to="/help/returns">View policy →</Link></div><div><span>Size guide</span><Link to="/help/size-guide">Find your fit →</Link></div><div><span>Help</span><Link to="/help/faq">Visit help centre →</Link></div></section>
  </div>
}
