import { Heart, MapPin, PackageCheck, UserRound } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function AccountPage() {
  return <div className="container account-page"><div className="account-hero"><div className="avatar"><UserRound /></div><div><span className="eyebrow">MY VELOURA</span><h1>Welcome back</h1><p>A polished demo account area—ready to connect to real authentication later.</p></div></div><div className="account-grid"><Link to="/wishlist"><Heart /><span><strong>Wishlist</strong><small>See your saved pieces</small></span></Link><div><PackageCheck /><span><strong>Orders</strong><small>No recent orders</small></span></div><div><MapPin /><span><strong>Addresses</strong><small>Add a delivery address</small></span></div></div><section className="account-panel"><h2>Account details</h2><div><span>Name</span><strong>Veloura Guest</strong></div><div><span>Email</span><strong>guest@veloura.example</strong></div><button className="button ghost">Edit profile</button></section></div>
}
