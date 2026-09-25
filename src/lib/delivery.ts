export type DeliveryEstimate={
  zone:string
  from:Date
  to:Date
  days:[number,number]
}

const ZONES:Record<string,{zone:string;days:[number,number]}>={
  '1':{zone:'North India',days:[4,7]},
  '2':{zone:'North/Central India',days:[4,7]},
  '3':{zone:'West India',days:[4,7]},
  '4':{zone:'West/Central India',days:[3,6]},
  '5':{zone:'South India',days:[3,5]},
  '6':{zone:'South India',days:[4,6]},
  '7':{zone:'East/Northeast India',days:[5,8]},
  '8':{zone:'East India',days:[5,8]},
  '9':{zone:'special postal zone',days:[6,10]},
}

function addBusinessDays(start:Date,days:number){
  const date=new Date(start)
  let added=0
  while(added<days){
    date.setDate(date.getDate()+1)
    const day=date.getDay()
    if(day!==0&&day!==6)added++
  }
  return date
}

export function estimateDelivery(pincode:string,now=new Date()):DeliveryEstimate|null{
  if(!/^\d{6}$/.test(pincode))return null
  const config=ZONES[pincode[0]] ?? {zone:'India',days:[5,8] as [number,number]}
  return {
    zone:config.zone,
    days:config.days,
    from:addBusinessDays(now,config.days[0]),
    to:addBusinessDays(now,config.days[1]),
  }
}

export function formatDeliveryDate(date:Date){
  return new Intl.DateTimeFormat('en-IN',{day:'numeric',month:'short'}).format(date)
}
