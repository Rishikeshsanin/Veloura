import { Heart } from 'lucide-react'
import { Link } from 'react-router-dom'
import ProductCard from '../components/ProductCard'
import { useShop } from '../store/ShopContext'

export default function WishlistPage() {
  const { wishlist } = useShop()
  return <div className="container wishlist-page"><div className="page-title"><span className="eyebrow">SAVED FOR LATER</span><h1>Your wishlist</h1><p>{wishlist.length ? `${wishlist.length} favourite${wishlist.length === 1 ? '' : 's'}, ready when you are.` : 'Keep the pieces you love in one place.'}</p></div>{wishlist.length ? <div className="product-grid shop-grid">{wishlist.map((p) => <ProductCard key={p.id} product={p} />)}</div> : <div className="empty-state standalone"><Heart size={40} /><h2>No favourites yet</h2><p>Tap the heart on any product and it will stay here.</p><Link className="button primary" to="/shop">Discover pieces</Link></div>}</div>
}
