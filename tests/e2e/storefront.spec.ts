import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

const mockCompare=[
  {id:910001,title:'Veloura Test Dress',description:'Test comparison dress.',category:'womens-dresses',price:2499,discountPercentage:20,rating:4.6,stock:8,brand:'Veloura Test',thumbnail:'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="400"%3E%3Crect width="100%25" height="100%25" fill="%23eee8e3"/%3E%3C/svg%3E',images:[],gender:'women',color:'Black',sizes:['S','M','L']},
  {id:910002,title:'Veloura Test Midi',description:'Second comparison dress.',category:'womens-dresses',price:3199,discountPercentage:10,rating:4.4,stock:4,brand:'Veloura Test',thumbnail:'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="400"%3E%3Crect width="100%25" height="100%25" fill="%23e5ded8"/%3E%3C/svg%3E',images:[],gender:'women',color:'Ivory',sizes:['XS','S','M']},
]

test('home, navigation and search shell render', async ({page}) => {
  await page.goto('/')
  await expect(page.locator('body')).toContainText('VELOURA')
  await expect(page.locator('#main-content')).toBeVisible()
  const search=page.locator('.search-launch').first()
  if(await search.isVisible()) {
    await search.click()
    await expect(page.getByRole('dialog',{name:'Search Veloura'})).toBeVisible()
  }
})

test('shop route and customer account surface are reachable', async ({page}) => {
  await page.goto('/shop?category=womens-dresses')
  await expect(page.locator('h1').first()).toContainText(/Dresses/i)
  await page.goto('/login')
  await expect(page.locator('body')).toContainText(/Sign in|Create account|Veloura/i)
})

test('compare page renders persisted products side by side', async ({page}) => {
  await page.goto('/')
  await page.evaluate((items)=>localStorage.setItem('veloura_compare_v1',JSON.stringify(items)),mockCompare)
  await page.goto('/compare')
  await expect(page.getByRole('heading',{name:'Compare styles'})).toBeVisible()
  await expect(page.locator('.compare-product-head')).toHaveCount(2)
  await expect(page.locator('body')).toContainText('Veloura Test Dress')
})

test('mobile dock remains usable on phone viewport', async ({page},testInfo) => {
  test.skip(!testInfo.project.name.includes('mobile'),'mobile-only check')
  await page.goto('/')
  await expect(page.locator('.mobile-dock')).toBeVisible()
})

test('compare tray stays above the mobile bottom dock', async ({page},testInfo) => {
  test.skip(!testInfo.project.name.includes('mobile'),'mobile-only check')
  await page.goto('/')
  await page.evaluate((items)=>localStorage.setItem('veloura_compare_v1',JSON.stringify(items)),mockCompare)
  await page.reload()
  const tray=page.locator('.compare-tray')
  const dock=page.locator('.mobile-dock')
  await expect(tray).toBeVisible()
  await expect(dock).toBeVisible()
  const trayBox=await tray.boundingBox()
  const dockBox=await dock.boundingBox()
  expect(trayBox).not.toBeNull()
  expect(dockBox).not.toBeNull()
  expect(trayBox!.y + trayBox!.height).toBeLessThanOrEqual(dockBox!.y + 2)
})

test('mobile core pages do not create document-level horizontal overflow', async ({page},testInfo) => {
  test.skip(!testInfo.project.name.includes('mobile'),'mobile-only check')
  for (const route of ['/', '/shop?category=womens-dresses', '/compare']) {
    if(route==='/compare') {
      await page.goto('/')
      await page.evaluate((items)=>localStorage.setItem('veloura_compare_v1',JSON.stringify(items)),mockCompare)
    }
    await page.goto(route)
    const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth)
    expect(overflow, `horizontal overflow on ${route}`).toBeLessThanOrEqual(2)
  }
})

for (const route of ['/', '/login']) {
  test(`no critical accessibility violations on ${route}`, async ({page}) => {
    await page.goto(route)
    const results=await new AxeBuilder({page}).analyze()
    const critical=results.violations.filter((violation)=>violation.impact==='critical')
    expect(critical,critical.map((item)=>item.id+': '+item.help).join('\n')).toEqual([])
  })
}


const accountProduct={id:918801,title:'Owned State Test Dress',description:'State isolation fixture.',category:'womens-dresses',price:2499,rating:4.6,stock:8,thumbnail:'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="400"%3E%3Crect width="100%25" height="100%25" fill="%23eee8e3"/%3E%3C/svg%3E',images:[],gender:'women',sizes:['M']}
const accountAddress={id:'VA-OWNER',label:'Home',firstName:'Account',lastName:'A',email:'a@example.com',phone:'9999999999',line1:'Account A Street',city:'Bengaluru',state:'Karnataka',pincode:'560001',country:'India',isDefault:true,createdAt:'2026-09-20T00:00:00.000Z'}
const accountOrder={id:'VLACCOUNTATEST',createdAt:'2026-09-20T00:00:00.000Z',status:'placed',items:[{product:accountProduct,size:'M',quantity:1}],subtotal:2499,discount:0,delivery:0,total:2499,paymentMethod:'cod',address:accountAddress}
const USER_A='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const USER_B='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
const SUPABASE_SESSION_KEY='sb-nowlwprtcnieihelqjoa-auth-token'

async function makeSupabaseOffline(page: import('@playwright/test').Page) {
  await page.route('https://nowlwprtcnieihelqjoa.supabase.co/**', async (route) => {
    if (new URL(route.request().url()).pathname.includes('/auth/v1/logout')) {
      await route.fulfill({status:204,body:''})
      return
    }
    await route.fulfill({status:503,contentType:'application/json',body:'{"message":"offline for ownership test"}'})
  })
}

async function seedFakeSession(page: import('@playwright/test').Page,userId:string,email:string) {
  await page.addInitScript(({key,userId,email})=>{
    const encode=(value:unknown)=>btoa(JSON.stringify(value)).replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_')
    const now=Math.floor(Date.now()/1000)
    const accessToken=`${encode({alg:'HS256',typ:'JWT'})}.${encode({sub:userId,aud:'authenticated',role:'authenticated',email,exp:now+3600,iat:now})}.test`
    if (!localStorage.getItem(key)) localStorage.setItem(key,JSON.stringify({
      access_token:accessToken,
      refresh_token:'test-refresh-token',
      token_type:'bearer',
      expires_in:3600,
      expires_at:now+3600,
      user:{id:userId,aud:'authenticated',role:'authenticated',email,app_metadata:{provider:'email',providers:['email']},user_metadata:{display_name:'Test User'},created_at:'2026-09-20T00:00:00.000Z'},
    }))
  },{key:SUPABASE_SESSION_KEY,userId,email})
}

async function setFakeSessionNow(page: import('@playwright/test').Page,userId:string,email:string) {
  await page.evaluate(({key,userId,email})=>{
    const encode=(value:unknown)=>btoa(JSON.stringify(value)).replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_')
    const now=Math.floor(Date.now()/1000)
    const accessToken=`${encode({alg:'HS256',typ:'JWT'})}.${encode({sub:userId,aud:'authenticated',role:'authenticated',email,exp:now+3600,iat:now})}.test`
    localStorage.setItem(key,JSON.stringify({
      access_token:accessToken,
      refresh_token:'test-refresh-token',
      token_type:'bearer',
      expires_in:3600,
      expires_at:now+3600,
      user:{id:userId,aud:'authenticated',role:'authenticated',email,app_metadata:{provider:'email',providers:['email']},user_metadata:{display_name:'Test User'},created_at:'2026-09-20T00:00:00.000Z'},
    }))
  },{key:SUPABASE_SESSION_KEY,userId,email})
}

test('guest shopping state survives owner initialization while legacy sensitive state is dropped', async ({page}) => {
  await page.addInitScript(({product,address,order})=>{
    localStorage.removeItem('veloura_state_owner_v2')
    localStorage.setItem('veloura_cart',JSON.stringify([{product,size:'M',quantity:1}]))
    localStorage.setItem('veloura_addresses_v1',JSON.stringify([address]))
    localStorage.setItem('veloura_orders_v1',JSON.stringify([order]))
  },{product:accountProduct,address:accountAddress,order:accountOrder})
  await page.goto('/cart')
  await expect(page.locator('body')).toContainText('Owned State Test Dress')
  await expect.poll(()=>page.evaluate(()=>localStorage.getItem('veloura_state_owner_v2'))).toBe('guest')
  await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('veloura_addresses_v1')||'[]').length)).toBe(0)
  await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('veloura_orders_v1')||'[]').length)).toBe(0)
})

test('account-owned state is not exposed after abnormal session loss', async ({page}) => {
  await page.addInitScript(({product,address,order,userA})=>{
    localStorage.setItem('veloura_state_owner_v2',userA)
    localStorage.setItem('veloura_cart',JSON.stringify([{product,size:'M',quantity:1}]))
    localStorage.setItem('veloura_addresses_v1',JSON.stringify([address]))
    localStorage.setItem('veloura_orders_v1',JSON.stringify([order]))
  },{product:accountProduct,address:accountAddress,order:accountOrder,userA:USER_A})
  await page.goto('/cart')
  await expect(page.locator('body')).not.toContainText('Owned State Test Dress')
  await expect.poll(()=>page.evaluate(()=>localStorage.getItem('veloura_state_owner_v2'))).toBe('guest')
  await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('veloura_addresses_v1')||'[]').length)).toBe(0)
  await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('veloura_orders_v1')||'[]').length)).toBe(0)
})

test('guest cart merges into first account but guest addresses and orders do not', async ({page}) => {
  await makeSupabaseOffline(page)
  await seedFakeSession(page,USER_A,'a@example.com')
  await page.addInitScript(({product,address,order})=>{
    localStorage.setItem('veloura_state_owner_v2','guest')
    localStorage.setItem('veloura_cart',JSON.stringify([{product,size:'M',quantity:1}]))
    localStorage.setItem('veloura_addresses_v1',JSON.stringify([address]))
    localStorage.setItem('veloura_orders_v1',JSON.stringify([order]))
  },{product:accountProduct,address:accountAddress,order:accountOrder})
  await page.goto('/cart')
  await expect(page.locator('body')).toContainText('Owned State Test Dress')
  await expect.poll(()=>page.evaluate(()=>localStorage.getItem('veloura_state_owner_v2'))).toBe(USER_A)
  await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('veloura_addresses_v1')||'[]').length)).toBe(0)
  await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('veloura_orders_v1')||'[]').length)).toBe(0)
})

test('same account keeps its owned local fallback when cloud sync is unavailable', async ({page}) => {
  await makeSupabaseOffline(page)
  await seedFakeSession(page,USER_A,'a@example.com')
  await page.addInitScript(({product,address,order,userA})=>{
    localStorage.setItem('veloura_state_owner_v2',userA)
    localStorage.setItem('veloura_cart',JSON.stringify([{product,size:'M',quantity:1}]))
    localStorage.setItem('veloura_addresses_v1',JSON.stringify([address]))
    localStorage.setItem('veloura_orders_v1',JSON.stringify([order]))
  },{product:accountProduct,address:accountAddress,order:accountOrder,userA:USER_A})
  await page.goto('/cart')
  await expect(page.locator('body')).toContainText('Owned State Test Dress')
  await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('veloura_addresses_v1')||'[]')[0]?.line1)).toBe('Account A Street')
  await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('veloura_orders_v1')||'[]')[0]?.id)).toBe('VLACCOUNTATEST')
})

test('state owned by user A is never merged into user B', async ({page}) => {
  await makeSupabaseOffline(page)
  await seedFakeSession(page,USER_B,'b@example.com')
  await page.addInitScript(({product,address,order,userA})=>{
    localStorage.setItem('veloura_state_owner_v2',userA)
    localStorage.setItem('veloura_cart',JSON.stringify([{product,size:'M',quantity:1}]))
    localStorage.setItem('veloura_addresses_v1',JSON.stringify([address]))
    localStorage.setItem('veloura_orders_v1',JSON.stringify([order]))
  },{product:accountProduct,address:accountAddress,order:accountOrder,userA:USER_A})
  await page.goto('/cart')
  await expect(page.locator('body')).not.toContainText('Owned State Test Dress')
  await expect.poll(()=>page.evaluate(()=>localStorage.getItem('veloura_state_owner_v2'))).toBe(USER_B)
  await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('veloura_addresses_v1')||'[]').length)).toBe(0)
  await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('veloura_orders_v1')||'[]').length)).toBe(0)
})


test('normal sign out clears account-owned state before a different account starts', async ({page}) => {
  await makeSupabaseOffline(page)
  await seedFakeSession(page,USER_A,'a@example.com')
  await page.addInitScript(({product,address,order,userA})=>{
    localStorage.setItem('veloura_state_owner_v2',userA)
    localStorage.setItem('veloura_cart',JSON.stringify([{product,size:'M',quantity:1}]))
    localStorage.setItem('veloura_addresses_v1',JSON.stringify([address]))
    localStorage.setItem('veloura_orders_v1',JSON.stringify([order]))
  },{product:accountProduct,address:accountAddress,order:accountOrder,userA:USER_A})

  await page.goto('/account')
  await expect(page.getByRole('button',{name:/sign out/i})).toBeVisible()
  await page.getByRole('button',{name:/sign out/i}).click()
  await expect.poll(()=>page.evaluate(()=>localStorage.getItem('veloura_state_owner_v2'))).toBe('guest')
  await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('veloura_addresses_v1')||'[]').length)).toBe(0)
  await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('veloura_orders_v1')||'[]').length)).toBe(0)

  await setFakeSessionNow(page,USER_B,'b@example.com')
  await page.reload()
  await expect.poll(()=>page.evaluate(()=>localStorage.getItem('veloura_state_owner_v2'))).toBe(USER_B)
  await expect(page.locator('body')).not.toContainText('Account A Street')
  await expect(page.locator('body')).not.toContainText('VLACCOUNTATEST')
})

test('SEO support files are served', async ({request}) => {
  const robots=await request.get('/robots.txt')
  expect(robots.ok()).toBeTruthy()
  expect(await robots.text()).toContain('Sitemap:')
  const sitemap=await request.get('/sitemap.xml')
  expect(sitemap.ok()).toBeTruthy()
  expect(await sitemap.text()).toContain('<urlset')
})
