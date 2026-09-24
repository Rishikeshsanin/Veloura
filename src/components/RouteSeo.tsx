import { useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { categoryLabel } from '../data/catalog'
import Seo from './Seo'

const PRIVATE_PREFIXES=['/account','/login','/wishlist','/cart','/checkout','/orders','/order/','/track-order','/catalog-control']

export default function RouteSeo(){
  const location=useLocation()
  const pathname=location.pathname
  const params=useMemo(()=>new URLSearchParams(location.search),[location.search])

  if(pathname.startsWith('/product/'))return null

  let title='Veloura Women — Fashion, Beauty & More'
  let description='Women’s fashion, beauty and accessories with curated discovery, editorial edits and a quality-filtered multi-source catalog.'
  let path=pathname
  let noindex=PRIVATE_PREFIXES.some((prefix)=>pathname===prefix||pathname.startsWith(prefix))
  let image:string|undefined

  if(pathname==='/shop'){
    const category=params.get('category')
    const query=params.get('q')
    if(category){
      const label=categoryLabel(category)
      title=`${label} for Women`
      description=`Discover ${label.toLowerCase()} across the quality-filtered Veloura women’s catalog.`
      path=`/shop?category=${encodeURIComponent(category)}`
    } else if(query){
      title=`Search “${query}”`
      description=`Search Veloura for ${query} across women’s fashion, beauty and accessories.`
      noindex=true
      path='/shop'
    } else {
      title='Shop Women'
      description='Browse dresses, tops, ethnic wear, footwear, bags, jewellery, beauty and more across Veloura.'
    }
  } else if(pathname==='/edits'){
    title='The Veloura Edit'
    description='Seasonal, occasion-led and mood-driven fashion edits built from the live Veloura catalog.'
  } else if(pathname.startsWith('/edit/')){
    const label=pathname.split('/').pop()?.replace(/-/g,' ')||'Editorial edit'
    title=label.replace(/\b\w/g,(char)=>char.toUpperCase())
    description=`Shop the Veloura ${label} editorial edit, curated from live women’s fashion and accessories.`
  } else if(pathname.startsWith('/brand/')){
    const brand=decodeURIComponent(pathname.split('/').pop()||'Brand')
    title=`${brand} at Veloura`
    description=`Explore ${brand} styles available through the Veloura women’s catalog.`
  } else if(pathname.startsWith('/help/')){
    const slug=pathname.split('/').pop()?.replace(/-/g,' ')||'Help'
    title=`Veloura ${slug.replace(/\b\w/g,(char)=>char.toUpperCase())}`
    description=`Veloura information about ${slug}, shopping support and storefront policies.`
  } else if(noindex){
    title=pathname==='/account'?'My Veloura':pathname==='/wishlist'?'Wishlist':pathname==='/cart'?'Shopping Bag':pathname==='/checkout'?'Checkout':pathname==='/login'?'Sign In':'My Veloura'
  } else if(pathname!=='/'){
    title='Veloura Women'
  }

  const organization={
    '@context':'https://schema.org',
    '@type':'Organization',
    name:'Veloura Women',
    url:'https://veloura-nine-theta.vercel.app',
  }
  const website={
    '@context':'https://schema.org',
    '@type':'WebSite',
    name:'Veloura Women',
    url:'https://veloura-nine-theta.vercel.app',
    potentialAction:{
      '@type':'SearchAction',
      target:'https://veloura-nine-theta.vercel.app/shop?q={search_term_string}',
      'query-input':'required name=search_term_string',
    },
  }

  return <Seo title={title} description={description} path={path} image={image} noindex={noindex} jsonLd={pathname==='/'?[organization,website]:undefined}/>
}
