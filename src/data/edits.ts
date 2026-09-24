export type EditorialEdit = {
  slug: string
  kicker: string
  title: string
  subtitle: string
  description: string
  hero: string
  portrait: string
  categories: string[]
  queries: string[]
  chips: Array<{ label: string; query: string }>
}

export const EDITORIAL_EDITS: EditorialEdit[] = [
  {
    slug: 'after-dark',
    kicker: 'VELOURA AFTER HOURS',
    title: 'After dark',
    subtitle: 'High-impact dressing for plans that start after sunset.',
    description: 'Sleek dresses, sharp heels, compact bags and finishing jewellery—edited for dinner, parties and everything that follows.',
    hero: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=1800&q=92',
    portrait: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=1100&q=92',
    categories: ['womens-dresses','womens-shoes','womens-bags','womens-jewellery'],
    queries: ['party dress','evening dress','women heels','clutch','statement earrings'],
    chips: [{label:'Party dresses',query:'party dress'},{label:'Heels',query:'women heels'},{label:'Mini bags',query:'mini bag'},{label:'Jewellery',query:'statement earrings'}],
  },
  {
    slug: 'soft-tailoring',
    kicker: 'THE WORKING WARDROBE',
    title: 'Soft tailoring',
    subtitle: 'Polished without looking overworked.',
    description: 'Relaxed blazers, fluid trousers, clean shirts and refined bags for office days, presentations and smarter everyday dressing.',
    hero: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=1800&q=92',
    portrait: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1100&q=92',
    categories: ['womens-tops','womens-bottoms','womens-outerwear','womens-bags'],
    queries: ['women blazer','workwear women','women shirt','tailored trousers'],
    chips: [{label:'Blazers',query:'women blazer'},{label:'Shirts',query:'women shirt'},{label:'Trousers',query:'tailored trousers'},{label:'Work bags',query:'tote bag'}],
  },
  {
    slug: 'vacation-mode',
    kicker: 'THE ESCAPE EDIT',
    title: 'Vacation mode',
    subtitle: 'Pack lighter. Dress better.',
    description: 'Easy dresses, resort separates, sandals, sunglasses and bags designed around warm days and slower plans.',
    hero: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=1800&q=92',
    portrait: 'https://images.unsplash.com/photo-1570976447640-ac859083963f?auto=format&fit=crop&w=1100&q=92',
    categories: ['womens-dresses','womens-swimwear','womens-shoes','womens-sunglasses','womens-bags'],
    queries: ['vacation dress','resort wear women','women sandals','sunglasses women'],
    chips: [{label:'Easy dresses',query:'vacation dress'},{label:'Resort',query:'resort wear women'},{label:'Sandals',query:'women sandals'},{label:'Shades',query:'sunglasses women'}],
  },
  {
    slug: 'modern-festive',
    kicker: 'THE CELEBRATION STORE',
    title: 'Modern festive',
    subtitle: 'Tradition, styled with a lighter hand.',
    description: 'Banarasi sarees, contemporary ethnic dressing, jewellery and polished accessories for weddings, pujas, receptions and festive evenings.',
    hero: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1800&q=92',
    portrait: 'https://images.unsplash.com/photo-1583391733956-6c78276477e2?auto=format&fit=crop&w=1100&q=92',
    categories: ['womens-ethnicwear','womens-jewellery','womens-bags','womens-shoes'],
    queries: ['saree','festive ethnic set','jewellery set','women heels'],
    chips: [{label:'Sarees',query:'saree'},{label:'Festive sets',query:'festive ethnic set'},{label:'Jewellery',query:'jewellery set'},{label:'Finishing touches',query:'clutch'}],
  },
  {
    slug: 'off-duty',
    kicker: 'WEEKEND UNIFORM',
    title: 'Off duty',
    subtitle: 'Low effort. Still considered.',
    description: 'Denim, tees, relaxed co-ords, sneakers and carry-everywhere bags for coffee runs, travel days and unplanned weekends.',
    hero: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1800&q=92',
    portrait: 'https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=1100&q=92',
    categories: ['womens-denim','womens-tops','womens-coords','womens-shoes','womens-bags'],
    queries: ['women jeans','women tee','women sneakers','crossbody bag'],
    chips: [{label:'Denim',query:'women jeans'},{label:'Easy tops',query:'women tee'},{label:'Sneakers',query:'women sneakers'},{label:'Crossbody',query:'crossbody bag'}],
  },
  {
    slug: 'beauty-reset',
    kicker: 'THE GETTING-READY EDIT',
    title: 'Beauty reset',
    subtitle: 'A quieter shelf. Better favourites.',
    description: 'Everyday skin, makeup, hair and fragrance essentials selected for a tighter, easier getting-ready routine.',
    hero: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=1800&q=92',
    portrait: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?auto=format&fit=crop&w=1100&q=92',
    categories: ['womens-beauty','womens-skincare','womens-haircare','womens-fragrance'],
    queries: ['lipstick','serum','hair care','perfume'],
    chips: [{label:'Makeup',query:'lipstick'},{label:'Skin',query:'serum'},{label:'Hair',query:'hair care'},{label:'Fragrance',query:'perfume'}],
  },
]

export const getEditorialEdit = (slug?: string) => EDITORIAL_EDITS.find((edit) => edit.slug === slug)
