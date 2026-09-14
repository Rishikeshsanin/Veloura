import type { Product } from '../types'

const API_USD_TO_INR = 84

export function toStoreRupees(value: number) {
  return value >= 500 ? Math.round(value) : Math.round(value * API_USD_TO_INR)
}

export function formatINR(value: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Math.round(value))
}

export function getProductPricing(product: Product) {
  const mrp = toStoreRupees(product.price)
  const discount = Math.max(0, Math.min(80, Math.round(product.discountPercentage ?? 0)))
  const selling = discount ? Math.round(mrp * (1 - discount / 100)) : mrp
  return {
    mrp,
    selling,
    discount,
    savings: Math.max(0, mrp - selling),
  }
}
