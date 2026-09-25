import { CheckCircle2, ImagePlus, Star, X } from 'lucide-react'
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { fetchVelouraReviews, findReviewEligibility, submitVelouraReview, uploadReviewImages, type ReviewEligibility, type VelouraReview } from '../lib/reviews'
import { useAuth } from '../store/AuthContext'

export default function VerifiedReviews({ productId }: { productId: number }) {
  const { user } = useAuth()
  const [reviews,setReviews] = useState<VelouraReview[]>([])
  const [eligibility,setEligibility] = useState<ReviewEligibility|null>(null)
  const [loading,setLoading] = useState(true)
  const [rating,setRating] = useState(5)
  const [comment,setComment] = useState('')
  const [sending,setSending] = useState(false)
  const [message,setMessage] = useState('')
  const [photos,setPhotos] = useState<File[]>([])
  const [photoPreviews,setPhotoPreviews] = useState<string[]>([])

  const refresh=async()=>{
    setLoading(true)
    try {
      const next=await fetchVelouraReviews(productId)
      setReviews(next)
      if(user) setEligibility(await findReviewEligibility(user.id,productId))
      else setEligibility(null)
    } catch {
      setReviews([])
      setEligibility(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(()=>{ refresh().catch(()=>undefined) },[productId,user?.id])
  useEffect(()=>{
    const urls=photos.map((file)=>URL.createObjectURL(file))
    setPhotoPreviews(urls)
    return()=>urls.forEach((url)=>URL.revokeObjectURL(url))
  },[photos])

  const average=useMemo(()=>reviews.length?reviews.reduce((sum,item)=>sum+item.rating,0)/reviews.length:0,[reviews])

  const submit=async(event:FormEvent)=>{
    event.preventDefault()
    if(!user||!eligibility)return
    setSending(true);setMessage('')
    try {
      const imageUrls=photos.length?await uploadReviewImages(user.id,photos):[]
      await submitVelouraReview(user.id,productId,eligibility,rating,comment,imageUrls)
      setComment('')
      setPhotos([])
      setMessage('Review published.')
      await refresh()
    } catch(error) {
      setMessage(error instanceof Error?error.message:'Could not publish this review.')
    } finally {
      setSending(false)
    }
  }

  if(loading && !reviews.length) return null
  if(!reviews.length && !eligibility) return user ? <section className="verified-reviews empty"><span className="eyebrow">VELOURA BUYER REVIEWS</span><h3>No verified reviews yet.</h3><p>After a delivered Veloura order, the exact purchased product becomes eligible for review.</p></section> : null

  return <section className="verified-reviews">
    <div className="verified-reviews-head">
      <div><span className="eyebrow">VELOURA BUYER REVIEWS</span><h3>{reviews.length?average.toFixed(1):'New'} <small>{reviews.length?'average rating':'Be the first verified buyer'}</small></h3></div>
      {reviews.length>0&&<strong>{reviews.length} verified {reviews.length===1?'review':'reviews'}</strong>}
    </div>

    {reviews.length>0&&<div className="verified-review-list">{reviews.slice(0,6).map((review)=><article key={review.id}><div><span>{Array.from({length:5}).map((_,index)=><Star key={index} size={12} fill={index<review.rating?'currentColor':'none'}/>)}</span><b><CheckCircle2 size={13}/> Verified Veloura purchase</b></div><p>{review.comment}</p>{review.imageUrls.length>0&&<div className="verified-review-images">{review.imageUrls.map((src,index)=><a href={src} target="_blank" rel="noreferrer" key={src}><img src={src} alt={'Review photo '+(index+1)}/></a>)}</div>}<small>{new Date(review.createdAt).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}</small></article>)}</div>}

    {eligibility&&<form className="verified-review-form" onSubmit={submit}><div><span className="eyebrow">YOUR DELIVERED PURCHASE</span><h4>How was this piece?</h4></div><div className="review-stars" aria-label="Rating">{[1,2,3,4,5].map((value)=><button type="button" key={value} className={value<=rating?'active':''} onClick={()=>setRating(value)} aria-label={value+' star'}><Star size={20} fill={value<=rating?'currentColor':'none'}/></button>)}</div><label>Review<textarea value={comment} onChange={(e)=>setComment(e.target.value)} minLength={3} maxLength={1500} required placeholder="Fit, feel, quality, styling — what would another shopper want to know?"/></label><label className="review-photo-picker"><span><ImagePlus size={16}/> Add up to 3 photos</span><input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={(e)=>setPhotos(Array.from(e.target.files||[]).slice(0,3))}/></label>{photoPreviews.length>0&&<div className="review-photo-previews">{photoPreviews.map((src,index)=><span key={src}><img src={src} alt={'Selected review '+(index+1)}/><button type="button" aria-label="Remove photo" onClick={()=>setPhotos((items)=>items.filter((_,i)=>i!==index))}><X size={12}/></button></span>)}</div>}{message&&<p>{message}</p>}<button className="button primary" disabled={sending}>{sending?'Publishing…':'Publish verified review'}</button></form>}

    {!user&&reviews.length>0&&<p className="verified-review-login"><Link to="/login">Sign in</Link> to review a delivered Veloura purchase.</p>}
  </section>
}
