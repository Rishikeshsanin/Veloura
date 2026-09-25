import { supabase, velouraDb } from './supabase'

export type VelouraReview = {
  id: string
  productId: number
  rating: number
  comment: string
  createdAt: string
  imageUrls: string[]
}

export type ReviewEligibility = {
  orderId: string
  orderItemId: string
}

export async function fetchVelouraReviews(productId: number): Promise<VelouraReview[]> {
  const { data, error } = await velouraDb()
    .from('product_reviews')
    .select('id,product_id,rating,comment,image_urls,created_at')
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
    imageUrls: Array.isArray(row.image_urls) ? row.image_urls.map(String) : [],
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
  imageUrls: string[] = [],
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
    image_urls: imageUrls.slice(0,3),
  })
  if (error) throw error
}


export async function uploadReviewImages(userId: string, files: File[]) {
  const selected=files.slice(0,3)
  const uploaded:string[]=[]
  const urls:string[]=[]
  try{
    for(const file of selected){
      if(file.size>5*1024*1024)throw new Error('Each review photo must be 5 MB or smaller.')
      if(!['image/jpeg','image/png','image/webp'].includes(file.type))throw new Error('Review photos must be JPG, PNG or WebP.')
      const ext=file.type==='image/png'?'png':file.type==='image/webp'?'webp':'jpg'
      const path=`${userId}/${crypto.randomUUID()}.${ext}`
      const { error }=await supabase.storage.from('veloura-review-media').upload(path,file,{cacheControl:'31536000',upsert:false,contentType:file.type})
      if(error)throw error
      uploaded.push(path)
      const { data }=supabase.storage.from('veloura-review-media').getPublicUrl(path)
      urls.push(data.publicUrl)
    }
    return urls
  }catch(error){
    if(uploaded.length)await supabase.storage.from('veloura-review-media').remove(uploaded).catch(()=>undefined)
    throw error
  }
}
