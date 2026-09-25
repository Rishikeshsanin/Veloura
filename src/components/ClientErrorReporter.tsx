import { useEffect } from 'react'
import { recordCommerceEvent } from '../lib/cloudCommerce'
import { useAuth } from '../store/AuthContext'

function clean(value:unknown){
  return String(value instanceof Error?value.message:value??'Unknown error').replace(/https?:\/\/\S+/g,'[url]').slice(0,300)
}

export default function ClientErrorReporter(){
  const { user }=useAuth()

  useEffect(()=>{
    if(!user)return
    let lastKey=''
    let lastAt=0
    const report=(source:string,message:unknown)=>{
      const value=clean(message)
      const key=source+'::'+value
      const now=Date.now()
      if(key===lastKey&&now-lastAt<10_000)return
      lastKey=key;lastAt=now
      recordCommerceEvent(user.id,'frontend_error',{
        metadata:{source,message:value,path:window.location.pathname},
      }).catch(()=>undefined)
    }
    const onError=(event:ErrorEvent)=>report('window.error',event.error||event.message)
    const onRejection=(event:PromiseRejectionEvent)=>report('unhandledrejection',event.reason)
    const onBoundary=(event:Event)=>report('error_boundary',(event as CustomEvent<{message?:string}>).detail?.message)
    window.addEventListener('error',onError)
    window.addEventListener('unhandledrejection',onRejection)
    window.addEventListener('veloura-ui-error',onBoundary)
    return()=>{
      window.removeEventListener('error',onError)
      window.removeEventListener('unhandledrejection',onRejection)
      window.removeEventListener('veloura-ui-error',onBoundary)
    }
  },[user?.id])

  return null
}
