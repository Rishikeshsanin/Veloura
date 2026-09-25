import { useEffect, type RefObject } from 'react'

const SELECTOR='a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'

export function useFocusTrap<T extends HTMLElement>(active:boolean, ref:RefObject<T | null>, onEscape?:()=>void){
  useEffect(()=>{
    if(!active||!ref.current)return
    const root=ref.current
    const previouslyFocused=document.activeElement instanceof HTMLElement?document.activeElement:null
    const focusables=()=>Array.from(root.querySelectorAll<HTMLElement>(SELECTOR)).filter((node)=>node.offsetParent!==null)
    const frame=requestAnimationFrame(()=>{if(!root.contains(document.activeElement))focusables()[0]?.focus()})
    const onKey=(event:KeyboardEvent)=>{
      if(event.key==='Escape'&&onEscape){event.preventDefault();onEscape();return}
      if(event.key!=='Tab')return
      const items=focusables()
      if(!items.length){event.preventDefault();root.focus();return}
      const first=items[0],last=items[items.length-1]
      if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus()}
      else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus()}
    }
    document.addEventListener('keydown',onKey)
    return()=>{cancelAnimationFrame(frame);document.removeEventListener('keydown',onKey);previouslyFocused?.focus()}
  },[active,ref,onEscape])
}
