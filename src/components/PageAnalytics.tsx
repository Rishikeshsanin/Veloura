import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { recordCommerceEvent } from '../lib/cloudCommerce'
import { useAuth } from '../store/AuthContext'

export default function PageAnalytics(){
  const { user }=useAuth()
  const location=useLocation()
  const lastRef=useRef('')

  useEffect(()=>{
    if(!user)return
    const key=location.pathname+location.search
    if(lastRef.current===key)return
    lastRef.current=key
    const params=new URLSearchParams(location.search)
    const metadata:Record<string,unknown>={path:location.pathname}
    if(params.get('category'))metadata.category=params.get('category')
    if(params.get('sort'))metadata.sort=params.get('sort')
    recordCommerceEvent(user.id,'page_view',{metadata}).catch(()=>undefined)
    const query=params.get('q')
    if(query)recordCommerceEvent(user.id,'search',{metadata:{query,category:params.get('category')||undefined}}).catch(()=>undefined)
  },[user?.id,location.pathname,location.search])

  return null
}
