import { ArrowLeft, ArrowRight } from 'lucide-react'
import { useRef } from 'react'
import { Link } from 'react-router-dom'
import type { Product } from '../types'
import ProductCard from './ProductCard'

export default function ProductRail({ eyebrow, title, subtitle, products, href = '/shop', compact = false }: { eyebrow?: string; title: string; subtitle?: string; products: Product[]; href?: string; compact?: boolean }) {
  const ref = useRef<HTMLDivElement>(null)
  const scroll = (direction: number) => ref.current?.scrollBy({ left: direction * Math.min(ref.current.clientWidth * 0.82, 980), behavior: 'smooth' })
  if (!products.length) return null
  return <section className="rail-section container"><div className="section-heading marketplace-heading"><div>{eyebrow && <span className="eyebrow">{eyebrow}</span>}<h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div><div className="section-heading-actions"><div className="rail-controls"><button onClick={() => scroll(-1)} aria-label="Scroll left"><ArrowLeft /></button><button onClick={() => scroll(1)} aria-label="Scroll right"><ArrowRight /></button></div><Link to={href}>View all <ArrowRight size={15} /></Link></div></div><div className={`product-rail ${compact ? 'compact' : ''}`} ref={ref}>{products.map((product) => <ProductCard key={product.id} product={product} compact={compact} />)}</div></section>
}
