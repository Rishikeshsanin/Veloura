import { Ruler } from 'lucide-react'
import { useMemo, useState } from 'react'

const APPAREL_ROWS=[
  {size:'XS',bust:32,waist:25,hip:35},
  {size:'S',bust:34,waist:27,hip:37},
  {size:'M',bust:36,waist:29,hip:39},
  {size:'L',bust:38,waist:31,hip:41},
  {size:'XL',bust:40,waist:33,hip:43},
]
const SHOE_ROWS=[
  {size:'36',foot:22.8},{size:'37',foot:23.5},{size:'38',foot:24.1},
  {size:'39',foot:24.8},{size:'40',foot:25.4},{size:'41',foot:26},
]
const ONE_SIZE=['womens-bags','womens-jewellery','womens-beauty','womens-skincare','womens-haircare','womens-fragrance','womens-watches','womens-sunglasses','womens-accessories']

export default function FitAdvisor({category}:{category:string}){
  const [bust,setBust]=useState('')
  const [waist,setWaist]=useState('')
  const [hip,setHip]=useState('')
  const [foot,setFoot]=useState('')

  const recommendation=useMemo(()=>{
    if(ONE_SIZE.includes(category))return null
    if(category==='womens-shoes'){
      const value=Number(foot)
      if(!value)return null
      const row=SHOE_ROWS.find((item)=>value<=item.foot) ?? SHOE_ROWS.at(-1)!
      return {size:row.size,note:'Closest general EU size from foot length.'}
    }
    const values=[Number(bust),Number(waist),Number(hip)]
    if(values.every((value)=>!value))return null
    const row=APPAREL_ROWS.find((item)=>
      (!values[0]||values[0]<=item.bust)&&(!values[1]||values[1]<=item.waist)&&(!values[2]||values[2]<=item.hip)
    ) ?? APPAREL_ROWS.at(-1)!
    return {size:row.size,note:'Suggested from the largest measurement entered.'}
  },[category,bust,waist,hip,foot])

  if(ONE_SIZE.includes(category))return null

  return <div className="fit-advisor">
    <div className="fit-advisor-head"><Ruler size={18}/><div><strong>Quick fit advisor</strong><span>Optional · general guide only</span></div></div>
    {category==='womens-shoes'
      ? <label>Foot length (cm)<input inputMode="decimal" value={foot} onChange={(e)=>setFoot(e.target.value.replace(/[^0-9.]/g,''))} placeholder="e.g. 24.2"/></label>
      : <div className="fit-advisor-grid"><label>Bust (in)<input inputMode="decimal" value={bust} onChange={(e)=>setBust(e.target.value.replace(/[^0-9.]/g,''))} placeholder="36"/></label><label>Waist (in)<input inputMode="decimal" value={waist} onChange={(e)=>setWaist(e.target.value.replace(/[^0-9.]/g,''))} placeholder="29"/></label><label>Hip (in)<input inputMode="decimal" value={hip} onChange={(e)=>setHip(e.target.value.replace(/[^0-9.]/g,''))} placeholder="39"/></label></div>}
    {recommendation&&<div className="fit-advisor-result"><span>Suggested size</span><strong>{recommendation.size}</strong><small>{recommendation.note} Brand-specific measurements should still take priority.</small></div>}
  </div>
}
