import { ArrowLeftRight, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useShop } from '../store/ShopContext'

export default function CompareTray(){
  const { compare,toggleCompare,clearCompare }=useShop()
  if(!compare.length)return null
  return <aside className="compare-tray" aria-label="Product comparison">
    <div><ArrowLeftRight size={16}/><span><strong>Compare</strong><small>{compare.length}/4 selected</small></span></div>
    <div className="compare-tray-items">{compare.map((product)=><span key={product.id}><img src={product.thumbnail} alt=""/><button aria-label={'Remove '+product.title} onClick={()=>toggleCompare(product)}><X size={11}/></button></span>)}</div>
    <Link className={compare.length<2?'disabled':''} aria-disabled={compare.length<2} to={compare.length>=2?'/compare':'#'}>Compare now</Link>
    <button className="compare-clear" onClick={clearCompare}>Clear</button>
  </aside>
}
