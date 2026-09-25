import type { CartItem, Product } from '../types'
import type { PreferenceSignals } from './personalization'
import type { Address, Order, OrderStatus, PaymentMethod } from './commerce'
import { velouraDb } from './supabase'
import { getProductPricing } from './money'

export type CloudCommerceState = {
  cart: CartItem[]
  savedForLater: CartItem[]
  wishlist: Product[]
  addresses: Address[]
  orders: Order[]
  recentlyViewed: Product[]
  preferenceSignals: PreferenceSignals
}

export type SyncableCommerceState = CloudCommerceState

const emptySignals: PreferenceSignals = { categories: {}, brands: {}, colors: {}, occasions: {} }

function asProduct(value: unknown): Product {
  return value as Product
}

function mergeProducts(local: Product[], cloud: Product[], limit?: number) {
  const seen = new Set<number>()
  const result: Product[] = []
  for (const product of [...cloud, ...local]) {
    if (!product || typeof product.id !== 'number' || seen.has(product.id)) continue
    seen.add(product.id)
    result.push(product)
    if (limit && result.length >= limit) break
  }
  return result
}

function mergeCart(local: CartItem[], cloud: CartItem[]) {
  const map = new Map<string, CartItem>()
  for (const item of [...cloud, ...local]) {
    const key = `${item.product.id}::${item.size}`
    const existing = map.get(key)
    map.set(key, existing ? { ...existing, quantity: Math.max(existing.quantity, item.quantity) } : item)
  }
  return [...map.values()]
}

function mergeAddresses(local: Address[], cloud: Address[]) {
  const map = new Map<string, Address>()
  for (const item of [...local, ...cloud]) map.set(item.id, item)
  const values = [...map.values()]
  if (values.length && !values.some((item) => item.isDefault)) values[0] = { ...values[0], isDefault: true }
  return values
}

const statusRank: Record<OrderStatus, number> = {
  placed: 1, confirmed: 2, packed: 3, shipped: 4, out_for_delivery: 5,
  delivered: 6, return_requested: 7, returned: 8, cancelled: 9,
}

function mergeOrders(local: Order[], cloud: Order[]) {
  const map = new Map<string, Order>()
  for (const order of [...local, ...cloud]) {
    const existing = map.get(order.id)
    if (!existing || statusRank[order.status] >= statusRank[existing.status]) map.set(order.id, order)
  }
  return [...map.values()].sort((a,b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
}

function mergeSignals(local: PreferenceSignals, cloud: PreferenceSignals): PreferenceSignals {
  const mergeBucket = (a: Record<string,number>, b: Record<string,number>) => {
    const out: Record<string,number> = { ...a }
    for (const [key,value] of Object.entries(b)) out[key] = Math.max(out[key] ?? 0, value)
    return out
  }
  return {
    categories: mergeBucket(local.categories ?? {}, cloud.categories ?? {}),
    brands: mergeBucket(local.brands ?? {}, cloud.brands ?? {}),
    colors: mergeBucket(local.colors ?? {}, cloud.colors ?? {}),
    occasions: mergeBucket(local.occasions ?? {}, cloud.occasions ?? {}),
  }
}

export function mergeCommerceState(local: CloudCommerceState, cloud: CloudCommerceState): CloudCommerceState {
  return {
    cart: mergeCart(local.cart, cloud.cart),
    savedForLater: mergeCart(local.savedForLater, cloud.savedForLater),
    wishlist: mergeProducts(local.wishlist, cloud.wishlist),
    addresses: mergeAddresses(local.addresses, cloud.addresses),
    orders: mergeOrders(local.orders, cloud.orders),
    recentlyViewed: mergeProducts(local.recentlyViewed, cloud.recentlyViewed, 18),
    preferenceSignals: mergeSignals(local.preferenceSignals, cloud.preferenceSignals),
  }
}

export async function loadCloudCommerce(userId: string): Promise<CloudCommerceState> {
  const db = velouraDb()
  const [profileR, addressR, cartR, wishlistR, ordersR] = await Promise.all([
    db.from('profiles').select('style_signals,recently_viewed').eq('user_id', userId).maybeSingle(),
    db.from('addresses').select('client_id,label,first_name,last_name,email,phone,line1,line2,city,state,pincode,country,is_default,created_at').eq('user_id', userId).order('created_at', { ascending: false }),
    db.from('cart_items').select('product_snapshot,size,quantity,saved_for_later').eq('user_id', userId).order('updated_at', { ascending: false }),
    db.from('wishlist_items').select('product_snapshot').eq('user_id', userId).order('created_at', { ascending: false }),
    db.from('orders').select('id,order_number,status,payment_method,subtotal,discount,delivery,total,coupon_code,delivery_address,created_at').eq('user_id', userId).order('created_at', { ascending: false }),
  ])

  const firstError = [profileR.error,addressR.error,cartR.error,wishlistR.error,ordersR.error].find(Boolean)
  if (firstError) throw firstError

  const orderRows = ordersR.data ?? []
  let itemRows: Array<Record<string, any>> = []
  if (orderRows.length) {
    const ids = orderRows.map((row:any) => row.id)
    const itemsR = await db.from('order_items').select('order_id,product_snapshot,size,quantity').in('order_id', ids)
    if (itemsR.error) throw itemsR.error
    itemRows = (itemsR.data ?? []) as Array<Record<string, any>>
  }

  const cartRows = cartR.data ?? []
  const allCart = cartRows.map((row:any) => ({
    product: asProduct(row.product_snapshot),
    size: String(row.size),
    quantity: Number(row.quantity || 1),
  }))

  const cart = allCart.filter((_item,index) => !(cartRows[index] as any)?.saved_for_later)
  const savedForLater = allCart.filter((_item,index) => Boolean((cartRows[index] as any)?.saved_for_later))

  const addresses: Address[] = (addressR.data ?? []).map((row:any) => ({
    id: String(row.client_id),
    label: row.label,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    phone: row.phone,
    line1: row.line1,
    line2: row.line2 || undefined,
    city: row.city,
    state: row.state,
    pincode: row.pincode,
    country: row.country,
    isDefault: Boolean(row.is_default),
    createdAt: row.created_at,
  }))

  const orders: Order[] = orderRows.map((row:any) => ({
    id: row.order_number,
    createdAt: row.created_at,
    status: row.status as OrderStatus,
    items: itemRows.filter((item) => item.order_id === row.id).map((item) => ({
      product: asProduct(item.product_snapshot),
      size: String(item.size),
      quantity: Number(item.quantity || 1),
    })),
    subtotal: Number(row.subtotal || 0),
    discount: Number(row.discount || 0),
    delivery: Number(row.delivery || 0),
    total: Number(row.total || 0),
    couponCode: row.coupon_code || undefined,
    paymentMethod: row.payment_method as PaymentMethod,
    address: row.delivery_address as Address,
  }))

  const profile = profileR.data as any
  return {
    cart,
    savedForLater,
    wishlist: (wishlistR.data ?? []).map((row:any) => asProduct(row.product_snapshot)),
    addresses,
    orders,
    recentlyViewed: Array.isArray(profile?.recently_viewed) ? profile.recently_viewed.map(asProduct) : [],
    preferenceSignals: profile?.style_signals && typeof profile.style_signals === 'object' ? profile.style_signals as PreferenceSignals : emptySignals,
  }
}

async function replaceOwnedRows(
  table: 'addresses' | 'cart_items' | 'wishlist_items',
  userId: string,
  rows: Array<Record<string, unknown>>,
) {
  const db = velouraDb()
  const deleteR = await db.from(table).delete().eq('user_id', userId)
  if (deleteR.error) throw deleteR.error
  if (!rows.length) return
  const insertR = await db.from(table).insert(rows)
  if (insertR.error) throw insertR.error
}

export async function pushCloudCommerce(
  userId: string,
  state: SyncableCommerceState,
  profile: { email?: string | null; displayName?: string | null },
) {
  const db = velouraDb()
  const now = new Date().toISOString()

  const profileR = await db.from('profiles').upsert({
    user_id: userId,
    email: profile.email ?? null,
    display_name: profile.displayName || null,
    style_signals: state.preferenceSignals,
    recently_viewed: state.recentlyViewed,
    updated_at: now,
  }, { onConflict: 'user_id' })
  if (profileR.error) throw profileR.error

  await replaceOwnedRows('addresses', userId, state.addresses.map((address) => ({
    user_id: userId,
    client_id: address.id,
    label: address.label,
    first_name: address.firstName,
    last_name: address.lastName,
    email: address.email,
    phone: address.phone,
    line1: address.line1,
    line2: address.line2 ?? null,
    city: address.city,
    state: address.state,
    pincode: address.pincode,
    country: address.country,
    is_default: Boolean(address.isDefault),
    created_at: address.createdAt,
    updated_at: now,
  })))

  await replaceOwnedRows('cart_items', userId, [
    ...state.cart.map((item) => ({ item, saved: false })),
    ...state.savedForLater.map((item) => ({ item, saved: true })),
  ].map(({item,saved}) => ({
    user_id: userId,
    product_id: item.product.id,
    size: item.size,
    quantity: item.quantity,
    product_snapshot: item.product,
    saved_for_later: saved,
    updated_at: now,
  })))

  await replaceOwnedRows('wishlist_items', userId, state.wishlist.map((product) => ({
    user_id: userId,
    product_id: product.id,
    product_snapshot: product,
  })))

  const existingR = await db.from('orders').select('id,order_number,status').eq('user_id', userId)
  if (existingR.error) throw existingR.error
  const existing = new Map((existingR.data ?? []).map((row:any) => [row.order_number, row]))

  for (const order of state.orders) {
    const found:any = existing.get(order.id)
    if (found) {
      if (order.status === 'cancelled' && found.status !== 'cancelled') {
        const updateR = await db.from('orders').update({ status: 'cancelled', updated_at: now }).eq('id', found.id).eq('user_id', userId)
        if (updateR.error) throw updateR.error
      }
      continue
    }

    const items = order.items.map((item) => ({
      product_id: item.product.id,
      source_id: item.product.sourceId ?? null,
      title: item.product.title,
      brand: item.product.brand ?? null,
      category: item.product.category,
      size: item.size,
      quantity: item.quantity,
      unit_price: Math.round(getProductPricing(item.product).selling),
      product_snapshot: item.product,
    }))

    const orderR = await db.rpc('create_order_snapshot', {
      p_order_number: order.id,
      p_payment_method: order.paymentMethod,
      p_subtotal: Math.round(order.subtotal),
      p_discount: Math.round(order.discount),
      p_delivery: Math.round(order.delivery),
      p_total: Math.round(order.total),
      p_coupon_code: order.couponCode ?? null,
      p_delivery_address: order.address,
      p_contact_email: order.address.email,
      p_contact_phone: order.address.phone,
      p_created_at: order.createdAt,
      p_items: items,
    })
    if (orderR.error) throw orderR.error

    if (order.status === 'cancelled') {
      const createdR = await db.from('orders').select('id').eq('user_id', userId).eq('order_number', order.id).maybeSingle()
      if (createdR.error) throw createdR.error
      if (createdR.data?.id) {
        const cancelR = await db.from('orders').update({ status: 'cancelled', updated_at: now }).eq('id', createdR.data.id).eq('user_id', userId)
        if (cancelR.error) throw cancelR.error
      }
    }
  }
}

export async function recordCommerceEvent(
  userId: string,
  eventName: string,
  data: { productId?: number; orderNumber?: string; metadata?: Record<string,unknown> } = {},
) {
  const { error } = await velouraDb().from('commerce_events').insert({
    user_id: userId,
    event_name: eventName,
    product_id: data.productId ?? null,
    order_number: data.orderNumber ?? null,
    metadata: data.metadata ?? {},
  })
  if (error) throw error
}
