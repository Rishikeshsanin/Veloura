import { useEffect, useRef, useState, type ComponentProps } from 'react'
import ProductRail from './ProductRail'

export default function DeferredProductRail(props: ComponentProps<typeof ProductRail>) {
  const marker = useRef<HTMLDivElement>(null)
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
  return <div ref={marker} aria-hidden="true" style={{ minHeight: 380 }} />
}
