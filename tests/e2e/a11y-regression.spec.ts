import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

const mockCompare=[
  {id:910001,title:'Veloura Test Dress',description:'Test comparison dress.',category:'womens-dresses',price:2499,discountPercentage:20,rating:4.6,stock:8,brand:'Veloura Test',thumbnail:'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="400"%3E%3Crect width="100%25" height="100%25" fill="%23eee8e3"/%3E%3C/svg%3E',images:[],gender:'women',color:'Black',sizes:['S','M','L']},
  {id:910002,title:'Veloura Test Midi',description:'Second comparison dress.',category:'womens-dresses',price:3199,discountPercentage:10,rating:4.4,stock:4,brand:'Veloura Test',thumbnail:'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="400"%3E%3Crect width="100%25" height="100%25" fill="%23e5ded8"/%3E%3C/svg%3E',images:[],gender:'women',color:'Ivory',sizes:['XS','S','M']},
]


const mockCatalogProductTitle='Regression QA Saree'
const fourCompare=[
  ...mockCompare,
  {...mockCompare[0],id:910003,title:'Veloura Compare Three'},
  {...mockCompare[1],id:910004,title:'Veloura Compare Four'},
]
const brokenWishlistProduct={...mockCompare[0],id:919991,title:'Broken Image Test',thumbnail:'https://broken.veloura.invalid/product.jpg',images:['https://broken.veloura.invalid/product.jpg']}

async function mockSourceCatalog(page: import('@playwright/test').Page) {
  const failBody='{"error":"intentional provider outage for guest regression"}'
  await page.route('**/catalog-source/**',async (route)=>{
    const url=new URL(route.request().url())
    if(url.pathname.includes('/catalog-source/vaanzari')) {
      await route.fulfill({
        status:200,
        contentType:'application/json',
        body:JSON.stringify({data:[{
          id:'regression-qa-saree',
          title:mockCatalogProductTitle,
          price:2499,
          image:'https://images.unsplash.com/photo-1610030469983-98e550d6193c',
          description:'Source-shaped QA saree used only by the local Playwright regression harness.',
          material:'Silk',
          technique:'Weaving',
          color:'Rose',
          occasion:'Regression QA',
        }]}),
      })
      return
    }
    await route.fulfill({status:503,contentType:'application/json',body:failBody})
  })
  for (const host of ['dummyjson.com','fakestoreapi.com','api.escuelajs.co','makeup-api.herokuapp.com']) {
    await page.route(`https://${host}/**`,(route)=>route.fulfill({status:503,contentType:'application/json',body:failBody}))
  }
  await page.route('https://images.unsplash.com/**',(route)=>route.fulfill({
    status:200,
    contentType:'image/svg+xml',
    body:'<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1000"><rect width="100%" height="100%" fill="#efe8e4"/></svg>',
  }))
}

async function openMockPdp(page: import('@playwright/test').Page) {
  await mockSourceCatalog(page)
  await page.goto('/shop?category=womens-ethnicwear')
  const productLink=page.getByRole('link',{name:mockCatalogProductTitle}).last()
  await expect(productLink).toBeVisible()
  const productHref=await productLink.getAttribute('href')
  expect(productHref).toMatch(/^\/product\//)
  await page.goto(productHref!)
  await expect(page).toHaveURL(/\/product\//,{timeout:20_000})
  await expect(page.getByRole('heading',{level:1,name:mockCatalogProductTitle})).toBeVisible({timeout:20_000})
}

test('confirmed Home accessibility regressions stay fixed', async ({page}) => {
  await mockSourceCatalog(page)
  await page.goto('/')
  const results=await new AxeBuilder({page}).withRules(['color-contrast','heading-order','image-redundant-alt']).analyze()
  expect(results.violations,results.violations.map((item)=>item.id+': '+item.help).join('\n')).toEqual([])

  await page.evaluate((items)=>localStorage.setItem('veloura_wishlist',JSON.stringify(items)),mockCompare)
  await page.goto('/wishlist')
  const imageLink=page.locator('.product-image-link').first()
  await expect(imageLink).toBeVisible()
  const alt=await imageLink.locator('img').first().getAttribute('alt')
  expect(alt).toBeTruthy()
  await expect(imageLink).toHaveAccessibleName(alt!)
})


test('keyboard search works and Escape closes the search dialog', async ({page},testInfo) => {
  test.skip(testInfo.project.name.includes('mobile'),'desktop keyboard interaction')
  await mockSourceCatalog(page)
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
  const pageErrors:string[]=[]
  page.on('pageerror',(error)=>pageErrors.push(error.message))
  await openMockPdp(page)

  await page.getByPlaceholder('Enter 6-digit pincode').fill('560001')
  await page.getByRole('button',{name:'CHECK'}).click()
  await expect(page.locator('.delivery-result')).toContainText('Sandbox estimate')

  await page.getByText('Where does the product information come from?').click()
  await expect(page.locator('.product-questions')).toContainText('Vaanzari')

  await page.getByRole('button',{name:'SIZE GUIDE'}).click()
  await expect(page.getByText('Quick fit advisor')).toBeVisible()
  await page.getByLabel('Bust (in)').fill('36')
  await page.getByLabel('Waist (in)').fill('29')
  await page.getByLabel('Hip (in)').fill('39')
  await expect(page.locator('.fit-advisor-result')).toContainText('M')
  await page.locator('.size-guide-close').click()

  await expect.poll(()=>page.evaluate((title)=>JSON.parse(localStorage.getItem('veloura_recent')||'[]').some((item:{title:string})=>item.title===title),mockCatalogProductTitle)).toBe(true)
  expect(pageErrors).toEqual([])
})

test('guest wishlist, cart and save-for-later round trip stays usable', async ({page}) => {
  await openMockPdp(page)
  await page.locator('.wishlist-detail').click()
  await page.getByRole('button',{name:/Add to bag/}).first().click()

  await page.goto('/cart')
  await expect(page.locator('body')).toContainText(mockCatalogProductTitle)
  await page.getByRole('button',{name:/Save for later/}).click()
  await expect(page.getByRole('heading',{name:'Saved for later'})).toBeVisible()
  await page.getByRole('button',{name:/Move to bag/}).click()
  await expect(page.locator('.cart-list')).toContainText(mockCatalogProductTitle)
  await page.getByRole('button',{name:/Move to wishlist/}).click()

  await page.goto('/wishlist')
  await expect(page.locator('body')).toContainText(mockCatalogProductTitle)
})

test('compare enforces the four-product maximum', async ({page}) => {
  await page.addInitScript((items)=>localStorage.setItem('veloura_compare_v1',JSON.stringify(items)),fourCompare)
  await openMockPdp(page)
  await page.locator('.compare-detail').click()
  await expect(page.getByRole('status')).toContainText('Compare up to 4 products at a time')
  await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('veloura_compare_v1')||'[]').length)).toBe(4)
})

test('broken product imagery falls back without a page error', async ({page}) => {
  const pageErrors:string[]=[]
  page.on('pageerror',(error)=>pageErrors.push(error.message))
  await page.route('https://broken.veloura.invalid/**',(route)=>route.fulfill({status:404,contentType:'image/jpeg',body:''}))
  await page.addInitScript((product)=>localStorage.setItem('veloura_wishlist',JSON.stringify([product])),brokenWishlistProduct)
  await page.goto('/wishlist')
  const card=page.locator('.product-card').filter({hasText:'Broken Image Test'})
  await expect(card.locator('.product-image-fallback')).toBeVisible()
  expect(pageErrors).toEqual([])
})

test('reduced-motion preference disables major image transitions', async ({page}) => {
  await page.emulateMedia({reducedMotion:'reduce'})
  await mockSourceCatalog(page)
  await page.goto('/')
  const duration=await page.locator('.hero-main img').evaluate((node)=>getComputedStyle(node).transitionDuration)
  expect(duration).toBe('0s')
})
