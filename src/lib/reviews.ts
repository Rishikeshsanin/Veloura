import { velouraDb } from './supabase'

export type VelouraReview = {
  id: string
  productId: number
  rating: number
  comment: string
  createdAt: string
}

export type ReviewEligibility = {
  orderId: string
  orderItemId: string
}

export async function fetchVelouraReviews(productId: number): Promise<VelouraReview[]> {
  const { data, error } = await velouraDb()
    .from('product_reviews')
    .select('id,product_id,rating,comment,created_at')
    .eq('product_id', productId)
    .order('created_at', { ascending: false })
    .limit(100)
  if (error) throw error
  return (data ?? []).map((row:any) => ({
    id: row.id,
    productId: Number(row.product_id),
    rating: Number(row.rating),
    comment: String(row.comment),
    createdAt: row.created_at,
  }))
}

export async function findReviewEligibility(_userId: string, productId: number): Promise<ReviewEligibility | null> {
  const { data, error } = await velouraDb().rpc('review_eligibility', { p_product_id: productId })
  if (error) throw error
  const row = Array.isArray(data) ? data[0] : null
  return row?.order_id && row?.order_item_id
    ? { orderId: String(row.order_id), orderItemId: String(row.order_item_id) }
    : null
}

export async function submitVelouraReview(
  userId: string,
  productId: number,
  eligibility: ReviewEligibility,
  rating: number,
  comment: string,
) {
  const clean = comment.trim()
  if (rating < 1 || rating > 5) throw new Error('Choose a rating from 1 to 5.')
  if (clean.length < 3) throw new Error('Add a little more detail to your review.')
  const { error } = await velouraDb().from('product_reviews').insert({
    user_id: userId,
    order_id: eligibility.orderId,
    order_item_id: eligibility.orderItemId,
    product_id: productId,
    rating,
    comment: clean,
    image_urls: [],
  })
  if (error) throw error
}
