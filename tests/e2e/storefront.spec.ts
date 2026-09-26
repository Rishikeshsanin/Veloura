import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

const mockCompare=[
  {id:910001,title:'Veloura Test Dress',description:'Test comparison dress.',category:'womens-dresses',price:2499,discountPercentage:20,rating:4.6,stock:8,brand:'Veloura Test',thumbnail:'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="400"%3E%3Crect width="100%25" height="100%25" fill="%23eee8e3"/%3E%3C/svg%3E',images:[],gender:'women',color:'Black',sizes:['S','M','L']},
  {id:910002,title:'Veloura Test Midi',description:'Second comparison dress.',category:'womens-dresses',price:3199,discountPercentage:10,rating:4.4,stock:4,brand:'Veloura Test',thumbnail:'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="400"%3E%3Crect width="100%25" height="100%25" fill="%23e5ded8"/%3E%3C/svg%3E',images:[],gender:'women',color:'Ivory',sizes:['XS','S','M']},
]


const truthProducts=[
  {id:919901,title:'Unknown Facts Dress',description:'Catalog item with intentionally unavailable optional facts.',category:'womens-dresses',price:2499,thumbnail:'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="400"%3E%3Crect width="100%25" height="100%25" fill="%23eee8e3"/%3E%3C/svg%3E',images:[],gender:'women'},
  {id:919902,title:'Explicit Sold Out Dress',description:'Catalog item with explicit zero stock.',category:'womens-dresses',price:2799,stock:0,thumbnail:'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="400"%3E%3Crect width="100%25" height="100%25" fill="%23e5ded8"/%3E%3C/svg%3E',images:[],gender:'women'},
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

test('unknown product facts stay absent while explicit zero stock remains sold out', async ({page}) => {
  await page.goto('/')
  await page.evaluate((items)=>localStorage.setItem('veloura_wishlist',JSON.stringify(items)),truthProducts)
  await page.goto('/wishlist')

  const unknown=page.locator('.product-card').filter({hasText:'Unknown Facts Dress'})
  await expect(unknown).toBeVisible()
  await expect(unknown.locator('.rating')).toHaveCount(0)
  await expect(unknown.locator('.stock-note')).toHaveCount(0)
  await expect(unknown.locator('.sale-pill')).toHaveCount(0)
  await expect(unknown.locator('.quick-add')).toBeEnabled()

  await unknown.locator('.quick-add').click()
  await page.goto('/cart')
  await expect(page.locator('body')).toContainText('Not specified')

  await page.goto('/wishlist')
  const soldOut=page.locator('.product-card').filter({hasText:'Explicit Sold Out Dress'})
  await expect(soldOut.locator('.stock-note')).toContainText('Out of stock')
  await expect(soldOut.locator('.quick-add')).toBeDisabled()
})

test('SEO support files are served', async ({request}) => {
  const robots=await request.get('/robots.txt')
  expect(robots.ok()).toBeTruthy()
  expect(await robots.text()).toContain('Sitemap:')
  const sitemap=await request.get('/sitemap.xml')
  expect(sitemap.ok()).toBeTruthy()
  expect(await sitemap.text()).toContain('<urlset')
})
