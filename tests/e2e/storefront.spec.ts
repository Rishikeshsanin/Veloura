import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

const mockCompare=[
  {id:910001,title:'Veloura Test Dress',description:'Test comparison dress.',category:'womens-dresses',price:2499,discountPercentage:20,rating:4.6,stock:8,brand:'Veloura Test',thumbnail:'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="400"%3E%3Crect width="100%25" height="100%25" fill="%23eee8e3"/%3E%3C/svg%3E',images:[],gender:'women',color:'Black',sizes:['S','M','L']},
  {id:910002,title:'Veloura Test Midi',description:'Second comparison dress.',category:'womens-dresses',price:3199,discountPercentage:10,rating:4.4,stock:4,brand:'Veloura Test',thumbnail:'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="400"%3E%3Crect width="100%25" height="100%25" fill="%23e5ded8"/%3E%3C/svg%3E',images:[],gender:'women',color:'Ivory',sizes:['XS','S','M']},
]


const fallbackProductTitle='Satin Drape Midi Dress'
const fourCompare=[
  ...mockCompare,
  {...mockCompare[0],id:910003,title:'Veloura Compare Three'},
  {...mockCompare[1],id:910004,title:'Veloura Compare Four'},
]
const brokenWishlistProduct={...mockCompare[0],id:919991,title:'Broken Image Test',thumbnail:'https://broken.veloura.invalid/product.jpg',images:['https://broken.veloura.invalid/product.jpg']}

async function forceFallbackCatalog(page: import('@playwright/test').Page) {
  const fail=async (route: import('@playwright/test').Route)=>route.fulfill({status:503,contentType:'application/json',body:'{"error":"intentional provider outage for guest regression"}'})
  await page.route('**/catalog-source/**',fail)
  for (const host of ['dummyjson.com','fakestoreapi.com','api.escuelajs.co','makeup-api.herokuapp.com']) {
    await page.route(`https://${host}/**`,fail)
  }
}

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

test('confirmed Home accessibility regressions stay fixed', async ({page}) => {
  await forceFallbackCatalog(page)
  await page.goto('/')
  const results=await new AxeBuilder({page}).withRules(['color-contrast','heading-order','image-redundant-alt']).analyze()
  expect(results.violations,results.violations.map((item)=>item.id+': '+item.help).join('\n')).toEqual([])

  const imageLink=page.locator('.product-image-link').first()
  await expect(imageLink).toBeVisible()
  const alt=await imageLink.locator('img').first().getAttribute('alt')
  expect(alt).toBeTruthy()
  await expect(imageLink).toHaveAccessibleName(alt!)
})


test('keyboard search works and Escape closes the search dialog', async ({page}) => {
  await forceFallbackCatalog(page)
  await page.goto('/')
  const search=page.locator('.search-launch').first()
  await search.focus()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('dialog',{name:'Search Veloura'})).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog',{name:'Search Veloura'})).toHaveCount(0)

  await search.focus()
  await page.keyboard.press('Enter')
  const input=page.getByRole('textbox',{name:'Search Veloura'})
  await input.fill('dress')
  await input.press('Enter')
  await expect(page).toHaveURL(/\/shop\?q=dress/)
})

test('guest PDP covers fit advisor, factual Q&A, sandbox pincode and recently viewed', async ({page}) => {
  await forceFallbackCatalog(page)
  const pageErrors:string[]=[]
  page.on('pageerror',(error)=>pageErrors.push(error.message))
  await page.goto('/product/9000?category=womens-dresses')
  await expect(page.getByRole('heading',{level:1,name:fallbackProductTitle})).toBeVisible()

  await page.getByPlaceholder('Enter 6-digit pincode').fill('560001')
  await page.getByRole('button',{name:'CHECK'}).click()
  await expect(page.locator('.delivery-result')).toContainText('Sandbox estimate')

  await page.getByText('Is it currently available?').click()
  await expect(page.locator('.product-questions')).toContainText('limited stock')

  await page.getByRole('button',{name:'SIZE GUIDE'}).click()
  await expect(page.getByText('Quick fit advisor')).toBeVisible()
  await page.getByLabel('Bust (in)').fill('36')
  await page.getByLabel('Waist (in)').fill('29')
  await page.getByLabel('Hip (in)').fill('39')
  await expect(page.locator('.fit-advisor-result')).toContainText('M')
  await page.locator('.size-guide-close').click()

  await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('veloura_recent')||'[]').some((item:{id:number})=>item.id===9000))).toBe(true)
  expect(pageErrors).toEqual([])
})

test('guest wishlist, cart and save-for-later round trip stays usable', async ({page}) => {
  await forceFallbackCatalog(page)
  await page.goto('/product/9000?category=womens-dresses')
  await page.getByRole('button',{name:'Wishlist'}).click()
  await page.getByRole('button',{name:/Add to bag/}).first().click()

  await page.goto('/cart')
  await expect(page.locator('body')).toContainText(fallbackProductTitle)
  await page.getByRole('button',{name:/Save for later/}).click()
  await expect(page.getByRole('heading',{name:'Saved for later'})).toBeVisible()
  await page.getByRole('button',{name:/Move to bag/}).click()
  await expect(page.locator('.cart-list')).toContainText(fallbackProductTitle)
  await page.getByRole('button',{name:/Move to wishlist/}).click()

  await page.goto('/wishlist')
  await expect(page.locator('body')).toContainText(fallbackProductTitle)
})

test('compare enforces the four-product maximum', async ({page}) => {
  await forceFallbackCatalog(page)
  await page.addInitScript((items)=>localStorage.setItem('veloura_compare_v1',JSON.stringify(items)),fourCompare)
  await page.goto('/product/9000?category=womens-dresses')
  await page.getByRole('button',{name:'Compare'}).click()
  await expect(page.getByRole('status')).toContainText('Compare up to 4 products at a time')
  await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('veloura_compare_v1')||'[]').length)).toBe(4)
})

test('broken product imagery falls back without a page error', async ({page}) => {
  const pageErrors:string[]=[]
  page.on('pageerror',(error)=>pageErrors.push(error.message))
  await page.route('https://broken.veloura.invalid/**',(route)=>route.abort())
  await page.addInitScript((product)=>localStorage.setItem('veloura_wishlist',JSON.stringify([product])),brokenWishlistProduct)
  await page.goto('/wishlist')
  const card=page.locator('.product-card').filter({hasText:'Broken Image Test'})
  await expect(card.locator('.product-image-fallback')).toBeVisible()
  expect(pageErrors).toEqual([])
})

test('reduced-motion preference disables major image transitions', async ({page}) => {
  await page.emulateMedia({reducedMotion:'reduce'})
  await forceFallbackCatalog(page)
  await page.goto('/')
  const duration=await page.locator('.hero-main img').evaluate((node)=>getComputedStyle(node).transitionDuration)
  expect(duration).toBe('0s')
})

test('SEO support files are served', async ({request}) => {
  const robots=await request.get('/robots.txt')
  expect(robots.ok()).toBeTruthy()
  expect(await robots.text()).toContain('Sitemap:')
  const sitemap=await request.get('/sitemap.xml')
  expect(sitemap.ok()).toBeTruthy()
  expect(await sitemap.text()).toContain('<urlset')
})
