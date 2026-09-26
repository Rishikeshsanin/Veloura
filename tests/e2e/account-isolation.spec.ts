import { test, expect } from '@playwright/test'

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
