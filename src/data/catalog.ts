export type CategoryConfig = {
  value: string
  label: string
  shortLabel?: string
  image: string
  blurb: string
}

export const WOMEN_CATEGORIES: CategoryConfig[] = [
  { value: 'womens-dresses', label: 'Dresses', image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=900&q=92', blurb: 'Mini, midi, maxi, bodycon, casual and occasion-ready silhouettes.' },
  { value: 'womens-tops', label: 'Tops & Tees', shortLabel: 'Tops', image: 'https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?auto=format&fit=crop&w=900&q=92', blurb: 'Everyday tops, statement shirts, blouses, knits and elevated basics.' },
  { value: 'womens-coords', label: 'Co-ords & Sets', shortLabel: 'Co-ords', image: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=900&q=92', blurb: 'Matching sets and two-piece looks for instant put-together energy.' },
  { value: 'womens-ethnicwear', label: 'Ethnic Wear', shortLabel: 'Ethnic', image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=900&q=92', blurb: 'Kurtas, festive sets, sarees and contemporary Indian dressing.' },
  { value: 'womens-bottoms', label: 'Trousers & Bottoms', shortLabel: 'Bottoms', image: 'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?auto=format&fit=crop&w=900&q=92', blurb: 'Trousers, skirts, shorts and easy everyday bottoms.' },
  { value: 'womens-denim', label: 'Denim', image: 'https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=900&q=92', blurb: 'Jeans, denim shirts, jackets and throw-on pieces.' },
  { value: 'womens-outerwear', label: 'Jackets & Outerwear', shortLabel: 'Outerwear', image: 'https://images.unsplash.com/photo-1548883354-94bcfe321cbb?auto=format&fit=crop&w=900&q=92', blurb: 'Blazers, jackets, shackets and polished layers.' },
  { value: 'womens-activewear', label: 'Activewear', image: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=900&q=92', blurb: 'Leggings, sports bras and studio-to-street pieces made to move.' },
  { value: 'womens-winterwear', label: 'Winterwear', image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=900&q=92', blurb: 'Knits, sweaters, cardigans and cold-weather layers.' },
  { value: 'womens-swimwear', label: 'Swim & Resort', shortLabel: 'Swim', image: 'https://images.unsplash.com/photo-1570976447640-ac859083963f?auto=format&fit=crop&w=900&q=92', blurb: 'Swimwear, resort separates and holiday-ready pieces.' },
  { value: 'womens-lingerie', label: 'Lingerie', image: 'https://images.unsplash.com/photo-1596755389378-c31d21fd1273?auto=format&fit=crop&w=900&q=92', blurb: 'Comfort-first intimates, bras and everyday essentials.' },
  { value: 'womens-sleepwear', label: 'Sleep & Lounge', shortLabel: 'Sleepwear', image: 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?auto=format&fit=crop&w=900&q=92', blurb: 'Pyjamas, lounge sets and soft off-duty layers.' },
  { value: 'womens-shoes', label: 'Footwear', image: 'https://images.unsplash.com/photo-1562273138-f46be4ebdf33?auto=format&fit=crop&w=900&q=92', blurb: 'Heels, flats, sneakers, boots and everyday footwear.' },
  { value: 'womens-bags', label: 'Handbags', shortLabel: 'Bags', image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=900&q=92', blurb: 'Totes, shoulder bags, clutches and polished everyday carryalls.' },
  { value: 'womens-jewellery', label: 'Jewellery', image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=900&q=92', blurb: 'Earrings, necklaces, bracelets and finishing touches.' },
  { value: 'womens-watches', label: 'Watches', image: 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?auto=format&fit=crop&w=900&q=92', blurb: 'Classic, minimal and statement watches for every day.' },
  { value: 'womens-sunglasses', label: 'Sunglasses', image: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=900&q=92', blurb: 'Frames and shades for polished finishing energy.' },
  { value: 'womens-accessories', label: 'Accessories', image: 'https://images.unsplash.com/photo-1556306535-38febf6782e7?auto=format&fit=crop&w=900&q=92', blurb: 'Belts, scarves, caps and the extras that change the whole look.' },
  { value: 'womens-beauty', label: 'Makeup', shortLabel: 'Beauty', image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=900&q=92', blurb: 'Makeup favourites for a complete getting-ready ritual.' },
  { value: 'womens-skincare', label: 'Skincare', image: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?auto=format&fit=crop&w=900&q=92', blurb: 'Cleansers, moisturisers, serums and everyday skin essentials.' },
  { value: 'womens-haircare', label: 'Haircare', image: 'https://images.unsplash.com/photo-1522338242992-e1a54906a8da?auto=format&fit=crop&w=900&q=92', blurb: 'Shampoo, styling and hair ritual favourites.' },
  { value: 'womens-fragrance', label: 'Fragrance', image: 'https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=900&q=92', blurb: 'Perfume, body mist and scent wardrobe discoveries.' },
]

export const categoryLabel = (value?: string | null) => WOMEN_CATEGORIES.find((item) => item.value === value)?.label ?? 'Women'

export const HEADER_NAV = [
  'womens-dresses',
  'womens-tops',
  'womens-coords',
  'womens-ethnicwear',
  'womens-bottoms',
  'womens-shoes',
  'womens-bags',
  'womens-jewellery',
  'womens-beauty',
  'womens-skincare',
  'womens-fragrance',
]
