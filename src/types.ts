export type ProductSource =
  | 'dummyjson'
  | 'fakestore'
  | 'platzi'
  | 'makeup'
  | 'scenesku'
  | 'solescout'
  | 'openbeauty'
  | 'freeestore'
  | 'curated'

export type Product = {
  id: number
  title: string
  description: string
  category: string
  price: number
  discountPercentage?: number
  rating?: number
  stock?: number
  brand?: string
  sku?: string
  thumbnail: string
  images: string[]
  tags?: string[]
  gender?: 'women'
  source?: ProductSource
  sourceId?: string
  sourceUrl?: string
  sourceLabel?: string
  color?: string
  occasion?: string
  sizes?: string[]
  reviews?: Array<{
    rating: number
    comment: string
    date?: string
    reviewerName?: string
    reviewerEmail?: string
  }>
}

export type CartItem = {
  product: Product
  quantity: number
  size: string
}
