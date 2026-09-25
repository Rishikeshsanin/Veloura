import { useEffect } from 'react'

const ORIGIN='https://veloura-nine-theta.vercel.app'

type Props={
  title:string
  description:string
  path?:string
  image?:string
  noindex?:boolean
  jsonLd?: Record<string,unknown> | Array<Record<string,unknown>>
}

function setMeta(selector:string,attrs:Record<string,string>) {
  let element=document.head.querySelector<HTMLMetaElement>(selector)
  if(!element){
    element=document.createElement('meta')
    Object.entries(attrs).filter(([key])=>key!=='content').forEach(([key,value])=>element!.setAttribute(key,value))
    document.head.appendChild(element)
  }
  if(attrs.content!==undefined)element.setAttribute('content',attrs.content)
}

export default function Seo({title,description,path='/',image,noindex=false,jsonLd}:Props){
  useEffect(()=>{
    const fullTitle=title.includes('Veloura')?title:`${title} — Veloura Women`
    const canonical=new URL(path,ORIGIN).toString()
    document.title=fullTitle

    setMeta('meta[name="description"]',{name:'description',content:description})
    setMeta('meta[property="og:title"]',{property:'og:title',content:fullTitle})
    setMeta('meta[property="og:description"]',{property:'og:description',content:description})
    setMeta('meta[property="og:url"]',{property:'og:url',content:canonical})
    setMeta('meta[property="og:type"]',{property:'og:type',content:'website'})
    setMeta('meta[name="twitter:card"]',{name:'twitter:card',content:image?'summary_large_image':'summary'})
    setMeta('meta[name="twitter:title"]',{name:'twitter:title',content:fullTitle})
    setMeta('meta[name="twitter:description"]',{name:'twitter:description',content:description})
    setMeta('meta[name="robots"]',{name:'robots',content:noindex?'noindex,nofollow':'index,follow'})
    if(image){
      setMeta('meta[property="og:image"]',{property:'og:image',content:image})
      setMeta('meta[name="twitter:image"]',{name:'twitter:image',content:image})
    } else {
      document.head.querySelector('meta[property="og:image"]')?.remove()
      document.head.querySelector('meta[name="twitter:image"]')?.remove()
    }

    let link=document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
    if(!link){link=document.createElement('link');link.rel='canonical';document.head.appendChild(link)}
    link.href=canonical

    document.head.querySelectorAll('script[data-veloura-seo]').forEach((node)=>node.remove())
    if(jsonLd){
      const values=Array.isArray(jsonLd)?jsonLd:[jsonLd]
      values.forEach((value)=>{
        const script=document.createElement('script')
        script.type='application/ld+json'
        script.dataset.velouraSeo='true'
        script.text=JSON.stringify(value)
        document.head.appendChild(script)
      })
    }
  },[title,description,path,image,noindex,jsonLd])
  return null
}
