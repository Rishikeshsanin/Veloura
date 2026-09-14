export type CategoryConfig = {
  value: string
  label: string
  shortLabel?: string
  image: string
  blurb: string
}

export const WOMEN_CATEGORIES: CategoryConfig[] = [
  { value: 'womens-dresses', label: 'Dresses', image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=900&q=92', blurb: 'Mini, midi, maxi and occasion-ready silhouettes.' },
  { value: 'womens-tops', label: 'Tops & Tees', shortLabel: 'Tops', image: 'https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?auto=format&fit=crop&w=900&q=92', blurb: 'Everyday tops, statement shirts and elevated basics.' },
  { value: 'womens-coords', label: 'Co-ords', image: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=900&q=92', blurb: 'Easy matching sets for instant put-together energy.' },
  { value: 'womens-ethnicwear', label: 'Ethnic Wear', shortLabel: 'Ethnic', image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=900&q=92', blurb: 'Contemporary kurtas, sets and festive dressing.' },
  { value: 'womens-shoes', label: 'Footwear', image: 'https://images.unsplash.com/photo-1562273138-f46be4ebdf33?auto=format&fit=crop&w=900&q=92', blurb: 'Heels, flats, sneakers and everything in between.' },
  { value: 'womens-bags', label: 'Handbags', shortLabel: 'Bags', image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=900&q=92', blurb: 'Totes, shoulder bags and polished everyday carryalls.' },
  { value: 'womens-jewellery', label: 'Jewellery', image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=900&q=92', blurb: 'Fine-looking finishing touches without the fuss.' },
  { value: 'womens-beauty', label: 'Beauty', image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=900&q=92', blurb: 'Beauty shelf favourites for the full getting-ready ritual.' },
  { value: 'womens-activewear', label: 'Activewear', image: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=900&q=92', blurb: 'Studio-to-street pieces made to move.' },
  { value: 'womens-winterwear', label: 'Winterwear', image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=900&q=92', blurb: 'Layers, knits and outerwear for cooler days.' },
]

export const categoryLabel = (value?: string | null) => WOMEN_CATEGORIES.find((item) => item.value === value)?.label ?? 'Women'

export const HEADER_NAV = ['womens-dresses','womens-tops','womens-coords','womens-ethnicwear','womens-shoes','womens-bags','womens-jewellery','womens-beauty']
