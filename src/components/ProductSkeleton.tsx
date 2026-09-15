export default function ProductSkeleton({ compact = false }: { compact?: boolean }) {
  return (
    <article className={`product-skeleton-card ${compact ? 'compact' : ''}`} aria-hidden="true">
      <div className="product-skeleton-media">
        <div className="veloura-loader-mark">
          <strong>V</strong>
          <span>VELOURA</span>
          <small>WOMEN</small>
        </div>
        <i className="skeleton-sweep" />
      </div>
      <div className="product-skeleton-copy">
        <span className="skeleton-line skeleton-brand" />
        <span className="skeleton-line skeleton-title" />
        <span className="skeleton-line skeleton-price" />
      </div>
    </article>
  )
}
