export type AlertPreferences={
  priceDrops:boolean
  backInStock:boolean
}

const KEY='veloura_alert_prefs_v1'
export const DEFAULT_ALERT_PREFERENCES:AlertPreferences={priceDrops:true,backInStock:true}

export function readAlertPreferences():AlertPreferences{
  try{
    const raw=localStorage.getItem(KEY)
    return raw?{...DEFAULT_ALERT_PREFERENCES,...JSON.parse(raw)}:DEFAULT_ALERT_PREFERENCES
  }catch{return DEFAULT_ALERT_PREFERENCES}
}

export function writeAlertPreferences(value:AlertPreferences){
  localStorage.setItem(KEY,JSON.stringify(value))
}

export async function requestBrowserAlerts(){
  if(typeof Notification==='undefined')return 'unsupported' as const
  if(Notification.permission==='granted')return 'granted' as const
  if(Notification.permission==='denied')return 'denied' as const
  const result=await Notification.requestPermission()
  return result
}

export function browserAlert(title:string,body:string,tag:string){
  if(typeof Notification==='undefined'||Notification.permission!=='granted')return
  try{new Notification(title,{body,tag})}catch{/* browser may block background notification construction */}
}

export function markAlertOnce(key:string){
  const storageKey='veloura_alert_seen_v1'
  try{
    const seen:Record<string,number>=JSON.parse(sessionStorage.getItem(storageKey)||'{}')
    if(seen[key])return false
    seen[key]=Date.now()
    sessionStorage.setItem(storageKey,JSON.stringify(seen))
    return true
  }catch{return true}
}
