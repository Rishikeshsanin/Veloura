import { Heart, MapPin, PackageCheck, Sparkles, UserRound } from 'lucide-react'
import { Link } from 'react-router-dom'
import { categoryLabel } from '../data/catalog'
import { topPreference } from '../lib/personalization'
import { useShop } from '../store/ShopContext'

export default function AccountPage() {
  const { wishlist, recentlyViewed, preferenceSignals, resetPreferences } = useShop()
  const favoriteCategory = topPreference(preferenceSignals, 'categories')
  const favoriteBrand = topPreference(preferenceSignals, 'brands')
  const favoriteColor = topPreference(preferenceSignals, 'colors')
  const hasProfile = Boolean(favoriteCategory || favoriteBrand || favoriteColor)

  return <div className="container account-page">
    <div className="account-hero"><div className="avatar"><UserRound /></div><div><span className="eyebrow">MY VELOURA</span><h1>Your shopping space</h1><p>Wishlist, recent browsing and optional style signals are stored on this device so Veloura can feel more useful without requiring an account.</p></div></div>
    <div className="account-grid"><Link to="/wishlist"><Heart /><span><strong>Wishlist</strong><small>{wishlist.length ? `${wishlist.length} saved styles` : 'Save pieces for later'}</small></span></Link><div><PackageCheck /><span><strong>Orders</strong><small>Order history appears here after checkout</small></span></div><div><MapPin /><span><strong>Addresses</strong><small>Delivery details are entered at checkout</small></span></div></div>

    <section className="account-panel style-account-panel">
      <div className="account-panel-title"><div><span className="eyebrow">PERSONALIZATION</span><h2>Your style signals</h2></div><Sparkles size={22}/></div>
      {hasProfile ? <div className="account-style-signals">
        {favoriteCategory && <div><span>Most explored</span><strong>{categoryLabel(favoriteCategory)}</strong></div>}
        {favoriteBrand && <div><span>Brand signal</span><strong>{favoriteBrand}</strong></div>}
        {favoriteColor && <div><span>Colour signal</span><strong>{favoriteColor}</strong></div>}
        <div><span>Recently viewed</span><strong>{recentlyViewed.length} styles</strong></div>
      </div> : <p className="account-muted">Browse, save or add a few products and Veloura will start shaping recommendations around the categories and brands you interact with.</p>}
      <div className="account-privacy-note"><strong>Stored locally</strong><span>These style signals stay in this browser. Resetting them does not delete your bag, wishlist or recently viewed products.</span></div>
      {hasProfile && <button className="button ghost" onClick={resetPreferences}>Reset style preferences</button>}
    </section>

    <section className="account-panel"><h2>Shopping support</h2><div><span>Returns</span><Link to="/help/returns">View policy →</Link></div><div><span>Size guide</span><Link to="/help/size-guide">Find your fit →</Link></div><div><span>Help</span><Link to="/help/faq">Visit help centre →</Link></div></section>
  </div>
}
