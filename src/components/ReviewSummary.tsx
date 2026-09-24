import { Star } from 'lucide-react'
import type { Product } from '../types'

export default function ReviewSummary({ reviews }: { reviews: NonNullable<Product['reviews']> }) {
  if (!reviews.length) return null

  const average = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
  const counts = [5,4,3,2,1].map((rating) => ({
    rating,
    count: reviews.filter((review) => Math.round(review.rating) === rating).length,
  }))

  return <section className="review-summary">
    <div className="review-summary-score">
      <span className="eyebrow">WRITTEN REVIEWS</span>
      <strong>{average.toFixed(1)}</strong>
      <div><Star size={15} fill="currentColor"/><span>{reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}</span></div>
    </div>
    <div className="review-summary-bars">
      {counts.map(({rating,count}) => {
        const width = reviews.length ? Math.round((count / reviews.length) * 100) : 0
        return <div key={rating}><span>{rating}</span><Star size={10} fill="currentColor"/><i><b style={{width:`${width}%`}}/></i><small>{count}</small></div>
      })}
    </div>
  </section>
}
