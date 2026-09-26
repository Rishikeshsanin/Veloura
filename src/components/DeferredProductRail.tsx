import { useEffect, useRef, useState, type ComponentProps } from 'react'
import ProductRail from './ProductRail'

export default function DeferredProductRail(props: ComponentProps<typeof ProductRail>) {
  const marker = useRef<HTMLElement>(null)
  const [ready, setReady] = useState(() => typeof window === 'undefined' || !('IntersectionObserver' in window))

  useEffect(() => {
    if (ready || !marker.current) return
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return
      setReady(true)
      observer.disconnect()
    }, { rootMargin: '1000px 0px' })
    observer.observe(marker.current)
    return () => observer.disconnect()
  }, [ready])

  if (ready) return <ProductRail {...props} />

  return <section ref={marker} className="rail-section container" aria-hidden="true">
    <div className="section-heading marketplace-heading" style={{ visibility: 'hidden' }}>
      <div>{props.eyebrow && <span className="eyebrow">{props.eyebrow}</span>}<h2>{props.title}</h2>{props.subtitle && <p>{props.subtitle}</p>}</div>
    </div>
    <div style={{ height: props.compact ? 340 : 380 }} />
  </section>
}
