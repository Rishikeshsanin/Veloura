import { lazy, Suspense, useEffect, useState } from 'react'
import { ChevronDown, Heart, HelpCircle, Home, Menu, Search, ShoppingBag, Truck, UserRound, X } from 'lucide-react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { HEADER_NAV, WOMEN_CATEGORIES } from '../data/catalog'
import { useShop } from '../store/ShopContext'
import RouteSeo from './RouteSeo'
import PageAnalytics from './PageAnalytics'
import CompareTray from './CompareTray'

const QuickViewModal = lazy(() => import('./QuickViewModal'))
const SearchOverlay = lazy(() => import('./SearchOverlay'))

const megaGroups = [
  { title: 'Clothing', values: ['womens-dresses','womens-tops','womens-coords','womens-ethnicwear','womens-bottoms','womens-denim','womens-outerwear','womens-winterwear'] },
  { title: 'Move & Lounge', values: ['womens-activewear','womens-swimwear','womens-lingerie','womens-sleepwear'] },
  { title: 'Shoes & Accessories', values: ['womens-shoes','womens-bags','womens-jewellery','womens-watches','womens-sunglasses','womens-accessories'] },
  { title: 'Beauty', values: ['womens-beauty','womens-skincare','womens-haircare','womens-fragrance'] },
]

export default function Layout() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const { cartCount, wishlist, quickViewProduct, actionToast } = useShop()
  const location = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' })
    setMenuOpen(false)
    setSearchOpen(false)
  }, [location.pathname])

  return <div className="app-shell"><RouteSeo/><PageAnalytics/><a className="skip-link" href="#main-content">Skip to content</a>
    <div className="offer-ribbon"><span>WOMEN'S FASHION ONLY</span><strong>EXTRA 10% OFF ON YOUR FIRST ORDER · CODE: HELLOVELOURA</strong><span>FREE SHIPPING ABOVE ₹1,499</span></div>
    <div className="utility-bar container-wide"><span>India</span><div><Link to="/help/faq"><HelpCircle size={13} /> Help</Link><Link to="/track-order"><Truck size={13} /> Track order</Link></div></div>
    <header className="site-header"><div className="header-inner container-wide"><button className="icon-button mobile-only" aria-label="Open menu" onClick={() => setMenuOpen(true)}><Menu size={23} /></button><Link className="brand" to="/">VELOURA<span>WOMEN</span></Link><button className="desktop-search search-launch" type="button" onClick={() => setSearchOpen(true)}><Search size={19} /><span>Search women’s fashion, beauty, bags and more</span><b>Search</b></button><div className="header-actions"><button className="icon-button mobile-only" aria-label="Search" onClick={() => setSearchOpen(true)}><Search size={21} /></button><Link className="header-action hide-small" aria-label="Account" to="/account"><UserRound size={20} /><span>Profile</span></Link><Link className="header-action badge-wrap" aria-label="Wishlist" to="/wishlist"><Heart size={20} /><span className="hide-label-mobile">Wishlist</span>{wishlist.length > 0 && <span className="badge">{wishlist.length}</span>}</Link><Link className="header-action badge-wrap" aria-label="Cart" to="/cart"><ShoppingBag size={20} /><span className="hide-label-mobile">Bag</span>{cartCount > 0 && <span className="badge">{cartCount}</span>}</Link></div></div></header>
    <nav className="category-nav"><div className="category-nav-inner container-wide"><NavLink to="/shop" end>New In</NavLink>{HEADER_NAV.slice(0,8).map((value) => { const category = WOMEN_CATEGORIES.find((item) => item.value === value); return category ? <NavLink key={value} to={`/shop?category=${value}`}>{category.shortLabel || category.label}</NavLink> : null })}<div className="mega-trigger"><button type="button">All Departments <ChevronDown size={14}/></button><div className="mega-menu"><div className="mega-menu-inner container-wide">{megaGroups.map((group) => <div className="mega-column" key={group.title}><h3>{group.title}</h3>{group.values.map((value) => { const category = WOMEN_CATEGORIES.find((item) => item.value === value); return category ? <Link key={value} to={`/shop?category=${value}`}>{category.label}<small>{category.blurb}</small></Link> : null })}</div>)}<div className="mega-feature"><span>VELOURA EDIT</span><strong>22 women-only departments</strong><p>From dresses and denim to skincare, fragrance and off-duty essentials.</p><Link className="button primary" to="/shop">Shop all women</Link></div></div></div></div><Link className="editorial-nav" to="/edits">The Edit</Link><Link className="sale-nav" to="/shop?sort=discount">Sale</Link></div></nav>

    {menuOpen && <div className="mobile-menu-backdrop" onClick={() => setMenuOpen(false)}><aside className="mobile-menu" onClick={(e) => e.stopPropagation()}><div className="mobile-menu-head"><span className="brand">VELOURA<span>WOMEN</span></span><button className="icon-button" onClick={() => setMenuOpen(false)}><X /></button></div><button className="menu-search menu-search-launch" onClick={() => { setMenuOpen(false); setSearchOpen(true) }}><Search size={18} /><span>Search women's fashion</span></button><p className="menu-label">Shop women</p><Link onClick={() => setMenuOpen(false)} to="/shop">New in</Link><Link onClick={() => setMenuOpen(false)} to="/edits">The Veloura Edit</Link>{megaGroups.map((group) => <div className="mobile-menu-group" key={group.title}><p className="menu-label">{group.title}</p>{group.values.map((value) => { const category = WOMEN_CATEGORIES.find((item) => item.value === value); return category ? <Link key={value} onClick={() => setMenuOpen(false)} to={`/shop?category=${value}`}>{category.label}</Link> : null })}</div>)}<div className="menu-divider" /><Link onClick={() => setMenuOpen(false)} to="/edits">Editorial edits</Link><Link onClick={() => setMenuOpen(false)} to="/wishlist">Wishlist</Link><Link onClick={() => setMenuOpen(false)} to="/account">My account</Link><Link onClick={() => setMenuOpen(false)} to="/orders">Orders</Link><Link onClick={() => setMenuOpen(false)} to="/track-order">Track order</Link><Link onClick={() => setMenuOpen(false)} to="/help/faq">Help & FAQ</Link></aside></div>}

    <Suspense fallback={null}>{searchOpen && <SearchOverlay open onClose={() => setSearchOpen(false)} />}{quickViewProduct && <QuickViewModal />}</Suspense>
    {actionToast && <div className="global-commerce-toast" role="status"><span>VELOURA</span><strong>{actionToast}</strong></div>}

    <main id="main-content" tabIndex={-1}><div key={`${location.pathname}${location.search}`} className="route-stage"><Outlet /></div></main>

    <CompareTray/>

    <nav className="mobile-dock" aria-label="Mobile navigation"><NavLink to="/" end><Home size={20}/><span>Home</span></NavLink><button type="button" onClick={() => setSearchOpen(true)}><Search size={20}/><span>Search</span></button><NavLink to="/wishlist" className="badge-wrap"><Heart size={20}/><span>Wishlist</span>{wishlist.length > 0 && <b>{wishlist.length}</b>}</NavLink><NavLink to="/cart" className="badge-wrap"><ShoppingBag size={20}/><span>Bag</span>{cartCount > 0 && <b>{cartCount}</b>}</NavLink><NavLink to="/account"><UserRound size={20}/><span>Profile</span></NavLink></nav>

    <footer className="footer"><div className="footer-grid container-wide"><div className="footer-about"><span className="brand footer-brand">VELOURA<span>WOMEN</span></span><p>A women-only fashion destination for everyday style, occasion dressing, accessories and beauty.</p><Link className="footer-story-link" to="/help/about">Our story →</Link></div><div><h4>Online shopping</h4><Link to="/shop?category=womens-dresses">Dresses</Link><Link to="/shop?category=womens-tops">Tops</Link><Link to="/shop?category=womens-ethnicwear">Ethnic wear</Link><Link to="/shop?category=womens-shoes">Footwear</Link><Link to="/shop?category=womens-beauty">Beauty</Link></div><div><h4>Customer policies</h4><Link to="/help/shipping">Shipping</Link><Link to="/help/returns">Returns & refunds</Link><Link to="/help/size-guide">Size guide</Link><Link to="/help/privacy">Privacy</Link><Link to="/help/terms">Terms</Link></div><div><h4>Useful links</h4><Link to="/track-order">Track order</Link><Link to="/orders">Orders</Link><Link to="/wishlist">Wishlist</Link><Link to="/help/contact">Contact us</Link><Link to="/help/faq">FAQ</Link></div><div className="footer-newsletter"><h4>Get the good stuff first</h4><p>New drops, big offers and editor picks—straight to your inbox.</p><form className="newsletter" onSubmit={(e) => e.preventDefault()}><input type="email" placeholder="Email address" required /><button>Join</button></form><small>By joining, you agree to receive Veloura marketing emails.</small></div></div><div className="footer-assurance container-wide"><div><strong>CURATED WOMEN'S STORE</strong><span>Multi-source catalog with quality gates</span></div><div><strong>EASY RETURNS</strong><span>30-day return window on eligible items</span></div><div><strong>PRIVATE ACCOUNT SYNC</strong><span>RLS-scoped data · payment remains sandboxed</span></div></div><div className="footer-bottom container-wide"><span>© 2026 Veloura Women</span><span>Fashion, beauty and accessories — curated for women</span></div></footer>
  </div>
}
