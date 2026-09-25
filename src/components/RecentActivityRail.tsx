import { useLocation } from 'react-router-dom'
import { useShop } from '../store/ShopContext'
import ProductRail from './ProductRail'

const ALLOWED=['/shop','/wishlist','/cart','/compare','/brand/','/edit/','/edits']

export default function RecentActivityRail(){
  const { recentlyViewed }=useShop()
  const location=useLocation()
  const allowed=ALLOWED.some((prefix)=>location.pathname===prefix||location.pathname.startsWith(prefix))
  if(!allowed||recentlyViewed.length<2)return null
  return <ProductRail eyebrow="RECENTLY VIEWED" title="Pick up where you left off" subtitle="Your latest product views stay available while you continue browsing." products={recentlyViewed.slice(0,16)}/>
}
