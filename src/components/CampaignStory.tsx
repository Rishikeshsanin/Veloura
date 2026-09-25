import { ArrowRight } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import ResponsiveImage from './ResponsiveImage'

const STORIES=[
  {name:'City',kicker:'01 / CITY HOURS',title:'Soft structure, sharper mornings.',copy:'Tailoring, clean bags and polished separates for working days that do not end at five.',href:'/edit/soft-tailoring',image:'https://images.unsplash.com/photo-1485230895905-ec40ba36b9bc?auto=format&fit=crop&w=1800&q=92'},
  {name:'Celebration',kicker:'02 / CELEBRATION',title:'Dress up without disappearing into the outfit.',copy:'Modern festive pieces, jewellery and occasion dressing with a lighter, more personal point of view.',href:'/edit/modern-festive',image:'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1800&q=92'},
  {name:'Escape',kicker:'03 / ESCAPE',title:'Pack less. Keep the good pieces.',copy:'Resort-ready dresses, sandals, shades and relaxed layers built around warm days and slower plans.',href:'/edit/vacation-mode',image:'https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=1800&q=92'},
]

export default function CampaignStory(){
  const [active,setActive]=useState(0)
  const story=STORIES[active]
  return <section className="campaign-story container-wide">
    <div className="campaign-story-top"><div><span className="eyebrow">VELOURA CAMPAIGN / VOLUME 01</span><h2>The new mood</h2></div><div className="campaign-story-tabs">{STORIES.map((item,index)=><button key={item.name} className={index===active?'active':''} onClick={()=>setActive(index)}>{item.name}</button>)}</div></div>
    <div className="campaign-story-stage" key={story.name}>
      <ResponsiveImage src={story.image} sizes="100vw" alt={story.name} loading="lazy" decoding="async"/>
      <div className="campaign-story-shade"/>
      <div className="campaign-story-copy"><span>{story.kicker}</span><h3>{story.title}</h3><p>{story.copy}</p><Link to={story.href}>Enter the story <ArrowRight size={15}/></Link></div>
      <div className="campaign-story-index">{String(active+1).padStart(2,'0')}<small>/03</small></div>
    </div>
  </section>
}
