import { test, expect } from '@playwright/test'

const truthProducts=[
  {id:919901,title:'Unknown Facts Dress',description:'Catalog item with intentionally unavailable optional facts.',category:'womens-dresses',price:2499,thumbnail:'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="400"%3E%3Crect width="100%25" height="100%25" fill="%23eee8e3"/%3E%3C/svg%3E',images:[],gender:'women'},
  {id:919902,title:'Explicit Sold Out Dress',description:'Catalog item with explicit zero stock.',category:'womens-dresses',price:2799,stock:0,thumbnail:'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="400"%3E%3Crect width="100%25" height="100%25" fill="%23e5ded8"/%3E%3C/svg%3E',images:[],gender:'women'},
]

test('unknown product facts stay absent while explicit zero stock remains sold out', async ({page}) => {
  await page.addInitScript((items)=>{
    localStorage.setItem('veloura_state_owner_v2','guest')
    localStorage.setItem('veloura_wishlist',JSON.stringify(items))
  },truthProducts)
  await page.goto('/wishlist')

  const unknown=page.locator('.product-card').filter({hasText:'Unknown Facts Dress'})
  await expect(unknown).toBeVisible()
  await expect(unknown.locator('.rating')).toHaveCount(0)
  await expect(unknown.locator('.stock-note')).toHaveCount(0)
  await expect(unknown.locator('.sale-pill')).toHaveCount(0)
  await expect(unknown.locator('.quick-add')).toBeEnabled()

  await unknown.locator('.quick-add').evaluate((button: HTMLElement)=>button.click())
  await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('veloura_cart')||'[]').some((item:{product:{id:number}})=>item.product.id===919901))).toBe(true)
  await page.goto('/cart')
  await expect(page.locator('body')).toContainText('Not specified')

  await page.goto('/wishlist')
  const soldOut=page.locator('.product-card').filter({hasText:'Explicit Sold Out Dress'})
  await expect(soldOut.locator('.stock-note')).toContainText('Out of stock')
  await expect(soldOut.locator('.quick-add')).toBeDisabled()
})
