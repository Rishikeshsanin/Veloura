import type { Product } from '../types'

type Seed = Omit<Product, 'id' | 'images' | 'thumbnail' | 'source' | 'gender'> & { image: string }

const seeds: Seed[] = [
  { title:'Satin Drape Midi Dress', description:'Fluid satin occasion dress with a soft draped neckline.', category:'womens-dresses', price:2999, discountPercentage:35, rating:4.8, stock:11, brand:'Solene Studio', image:'https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=1000&q=92', occasion:'party', sizes:['XS','S','M','L','XL'] },
  { title:'Midnight Column Dress', description:'Minimal black evening dress with a refined straight silhouette.', category:'womens-dresses', price:3599, discountPercentage:42, rating:4.7, stock:18, brand:'Noir House', image:'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=1000&q=92', occasion:'evening', sizes:['XS','S','M','L','XL'] },
  { title:'Soft Tailored Shirt', description:'Relaxed tailoring for workdays, weekends and everything after.', category:'womens-tops', price:1699, discountPercentage:30, rating:4.6, stock:24, brand:'Studio North', image:'https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?auto=format&fit=crop&w=1000&q=92', occasion:'work', sizes:['XS','S','M','L','XL'] },
  { title:'Linen Co-ord Set', description:'Easy matching set with a clean, polished resort feel.', category:'womens-coords', price:2799, discountPercentage:38, rating:4.7, stock:16, brand:'Sunday Form', image:'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=1000&q=92', occasion:'vacation', sizes:['XS','S','M','L','XL'] },
  { title:'Embroidered Festive Kurta Set', description:'Contemporary festive set with delicate embroidery and easy tailoring.', category:'womens-ethnicwear', price:3999, discountPercentage:45, rating:4.9, stock:10, brand:'Aara', image:'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1000&q=92', occasion:'festive', sizes:['XS','S','M','L','XL','XXL'] },
  { title:'Sculpted Heel Sandals', description:'Minimal heels built to finish party and occasion looks.', category:'womens-shoes', price:2299, discountPercentage:40, rating:4.6, stock:20, brand:'Linea', image:'https://images.unsplash.com/photo-1562273138-f46be4ebdf33?auto=format&fit=crop&w=1000&q=92', occasion:'party', sizes:['36','37','38','39','40'] },
  { title:'Structured Shoulder Bag', description:'Compact shoulder bag with polished hardware and a clean silhouette.', category:'womens-bags', price:2499, discountPercentage:44, rating:4.8, stock:14, brand:'Maison V', image:'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=1000&q=92', occasion:'everyday', sizes:['One Size'] },
  { title:'Pearl Drop Earrings', description:'Modern pearl drops with a refined high-shine finish.', category:'womens-jewellery', price:1299, discountPercentage:50, rating:4.9, stock:30, brand:'Muse', image:'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=1000&q=92', occasion:'occasion', sizes:['One Size'] },
  { title:'Glow Ritual Beauty Kit', description:'A curated everyday beauty set for a fresh, luminous finish.', category:'womens-beauty', price:1599, discountPercentage:32, rating:4.7, stock:28, brand:'Halo Beauty', image:'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=1000&q=92', occasion:'beauty', sizes:['One Size'] },
  { title:'Studio Sculpt Leggings', description:'Supportive high-rise activewear made for movement and errands.', category:'womens-activewear', price:1899, discountPercentage:36, rating:4.6, stock:22, brand:'Motion', image:'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=1000&q=92', occasion:'active', sizes:['XS','S','M','L','XL'] },
  { title:'Soft Knit Longline Cardigan', description:'A soft layering piece with an oversized drape and clean finish.', category:'womens-winterwear', price:2699, discountPercentage:41, rating:4.7, stock:19, brand:'North & Knit', image:'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1000&q=92', occasion:'winter', sizes:['S','M','L','XL'] },
]

const adjectives = ['Signature','Modern','Essential','Elevated','Weekend']

export const fallbackProducts: Product[] = seeds.flatMap((seed, seedIndex) =>
  Array.from({ length: 5 }, (_, variant) => ({
    ...seed,
    id: 9000 + seedIndex * 10 + variant,
    title: `${adjectives[variant]} ${seed.title}`,
    price: Math.max(699, seed.price + variant * 180 - 320),
    discountPercentage: Math.min(65, (seed.discountPercentage ?? 25) + variant * 3),
    rating: Math.min(4.9, (seed.rating ?? 4.5) + (variant % 3) * 0.05),
    stock: Math.max(5, (seed.stock ?? 20) - variant * 2),
    thumbnail: seed.image,
    images: [seed.image],
    tags: [seed.category.replace('womens-',''), seed.occasion ?? 'women', adjectives[variant].toLowerCase()],
    gender: 'women' as const,
    source: 'curated' as const,
  }))
)
