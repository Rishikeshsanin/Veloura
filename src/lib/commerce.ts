import type { CartItem } from '../types'

export type PaymentMethod = 'upi' | 'card' | 'cod'
export type OrderStatus = 'placed' | 'confirmed' | 'packed' | 'shipped' | 'out_for_delivery' | 'delivered' | 'cancelled' | 'return_requested' | 'returned'

export type Address = {
  id: string
  label: string
  firstName: string
  lastName: string
  email: string
  phone: string
  line1: string
  line2?: string
  city: string
  state: string
  pincode: string
  country: string
  isDefault?: boolean
  createdAt: string
}

export type Order = {
  id: string
  createdAt: string
  status: OrderStatus
  items: CartItem[]
  subtotal: number
  discount: number
  delivery: number
  total: number
  couponCode?: string
  paymentMethod: PaymentMethod
  address: Address
}

export type CouponResult =
  | { ok: true; code: string; label: string; discount: number }
  | { ok: false; code: string; message: string }

export const FREE_DELIVERY_THRESHOLD = 1499

const coupons = {
  HELLOVELOURA: { label: 'First order · 10% off', min: 999, type: 'percent' as const, value: 10, max: 500, firstOrderOnly: true },
  SAVE300: { label: '₹300 off orders above ₹1,999', min: 1999, type: 'fixed' as const, value: 300, firstOrderOnly: false },
}

export function calculateDelivery(subtotal: number) {
  return subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : 99
}

export function evaluateCoupon(rawCode: string, subtotal: number, existingOrders: number): CouponResult {
  const code = rawCode.trim().toUpperCase()
  const rule = coupons[code as keyof typeof coupons]
  if (!rule) return { ok: false, code, message: 'That coupon is not available.' }
  if (subtotal < rule.min) return { ok: false, code, message: `Spend ${formatMoney(rule.min)} to use this offer.` }
  if (rule.firstOrderOnly && existingOrders > 0) return { ok: false, code, message: 'HELLOVELOURA is reserved for the first order.' }
  const discount = rule.type === 'percent'
    ? Math.min(Math.round(subtotal * (rule.value / 100)), rule.max ?? Number.POSITIVE_INFINITY)
    : Math.min(rule.value, subtotal)
  return { ok: true, code, label: rule.label, discount }
}

export function totalsFor(subtotal: number, coupon: CouponResult | null) {
  const discount = coupon?.ok ? coupon.discount : 0
  const discountedSubtotal = Math.max(0, subtotal - discount)
  const delivery = calculateDelivery(discountedSubtotal)
  return { subtotal, discount, delivery, total: discountedSubtotal + delivery }
}

export function createId(prefix: string) {
  const now = Date.now().toString(36).toUpperCase()
  const random = typeof crypto !== 'undefined' && 'getRandomValues' in crypto
    ? Array.from(crypto.getRandomValues(new Uint8Array(4))).map((n) => n.toString(16).padStart(2,'0')).join('').toUpperCase()
    : Math.random().toString(36).slice(2,10).toUpperCase()
  return `${prefix}${now.slice(-6)}${random.slice(0,6)}`
}

export function createOrderId() {
  return createId('VL')
}

export function createAddressId() {
  return createId('VA')
}

export const ORDER_STATUS_META: Record<OrderStatus, { label: string; detail: string }> = {
  placed: { label: 'Order placed', detail: 'We have received your order.' },
  confirmed: { label: 'Confirmed', detail: 'The order has been confirmed for fulfilment.' },
  packed: { label: 'Packed', detail: 'Your items are packed and ready to move.' },
  shipped: { label: 'Shipped', detail: 'The parcel has left the fulfilment centre.' },
  out_for_delivery: { label: 'Out for delivery', detail: 'The courier is on the final delivery run.' },
  delivered: { label: 'Delivered', detail: 'The order has been delivered.' },
  cancelled: { label: 'Cancelled', detail: 'This order was cancelled.' },
  return_requested: { label: 'Return requested', detail: 'A return request has been recorded.' },
  returned: { label: 'Returned', detail: 'The returned order has been received.' },
}

const FULFILMENT_STEPS: OrderStatus[] = ['placed','confirmed','packed','shipped','out_for_delivery','delivered']

export function orderTimeline(order: Order) {
  const currentIndex = Math.max(0, FULFILMENT_STEPS.indexOf(order.status))
  const base = new Date(order.createdAt).getTime()
  const offsets = [0, 2, 18, 36, 72, 120].map((hours) => hours * 60 * 60 * 1000)
  return FULFILMENT_STEPS.map((status, index) => ({
    status,
    ...ORDER_STATUS_META[status],
    reached: order.status !== 'cancelled' && order.status !== 'return_requested' && order.status !== 'returned' && index <= currentIndex,
    expectedAt: new Date(base + offsets[index]).toISOString(),
  }))
}

export function cloneCart(items: CartItem[]) {
  return items.map((item) => ({ ...item, product: { ...item.product, images: [...(item.product.images ?? [])] } }))
}

function formatMoney(value: number) {
  return `₹${Math.round(value).toLocaleString('en-IN')}`
}
