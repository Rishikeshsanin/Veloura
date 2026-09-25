import { Bell, BellOff, TrendingDown } from 'lucide-react'
import { useState } from 'react'
import { readAlertPreferences, requestBrowserAlerts, writeAlertPreferences, type AlertPreferences } from '../lib/notifications'

export default function NotificationPreferences(){
  const [prefs,setPrefs]=useState<AlertPreferences>(readAlertPreferences)
  const [permission,setPermission]=useState(()=>typeof Notification==='undefined'?'unsupported':Notification.permission)
  const update=(key:keyof AlertPreferences,value:boolean)=>{
    const next={...prefs,[key]:value}
    setPrefs(next);writeAlertPreferences(next)
  }
  const enable=async()=>setPermission(await requestBrowserAlerts())

  return <section className="account-panel notification-prefs">
    <div className="account-panel-title"><div><span className="eyebrow">SHOPPING ALERTS</span><h2>Browser notifications</h2></div>{permission==='granted'?<Bell size={21}/>:<BellOff size={21}/>}</div>
    <p className="account-muted">Optional browser-only alerts. Veloura does not send email/SMS alerts until a production messaging provider is connected.</p>
    <div className="notification-pref-list">
      <label><span><TrendingDown size={16}/><b>Price drops</b><small>Notify after your wishlist detects a real lower live-catalog price.</small></span><input type="checkbox" checked={prefs.priceDrops} onChange={(e)=>update('priceDrops',e.target.checked)}/></label>
      <label><span><Bell size={16}/><b>Back in stock</b><small>Notify when a previously sold-out wishlist item is available again.</small></span><input type="checkbox" checked={prefs.backInStock} onChange={(e)=>update('backInStock',e.target.checked)}/></label>
    </div>
    {permission!=='granted'&&permission!=='unsupported'&&<button className="button outline" onClick={enable}>Enable browser alerts</button>}
    {permission==='denied'&&<small className="notification-permission-note">Notifications are blocked in browser settings.</small>}
    {permission==='unsupported'&&<small className="notification-permission-note">This browser does not expose Web Notifications.</small>}
  </section>
}
