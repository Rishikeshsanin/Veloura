import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { CartItem, Product } from '../types'
import { getProductPricing } from '../lib/money'
import { addProductSignal, EMPTY_PREFERENCE_SIGNALS, type PreferenceSignals } from '../lib/personalization'
import { loadCloudCommerce, mergeCommerceState, pushCloudCommerce, recordCommerceEvent } from '../lib/cloudCommerce'
import { useAuth } from './AuthContext'
import {
  cloneCart,
  createAddressId,
  createOrderId,
  evaluateCoupon,
  totalsFor,
  type Address,
  type CouponResult,
  type Order,
  type PaymentMethod,
} from '../lib/commerce'

type NewAddress = Omit<Address, 'id' | 'createdAt' | 'isDefault'> & { isDefault?: boolean }

type ShopState = {
  cart: CartItem[]
  wishlist: Product[]
  compare: Product[]
  recentlyViewed: Product[]
  savedForLater: CartItem[]
  addresses: Address[]
  orders: Order[]
  quickViewProduct: Product | null
  preferenceSignals: PreferenceSignals
  actionToast: string
  coupon: CouponResult | null
  addToCart: (product: Product, size?: string, quantity?: number) => void
  removeFromCart: (productId: number, size?: string) => void
  updateQuantity: (productId: number, size: string, quantity: number) => void
  toggleWishlist: (product: Product) => void
  toggleCompare: (product: Product) => void
  isCompared: (productId: number) => boolean
  clearCompare: () => void
  isWishlisted: (productId: number) => boolean
  recordRecentlyViewed: (product: Product) => void
  openQuickView: (product: Product) => void
  closeQuickView: () => void
  cartCount: number
  subtotal: number
  clearCart: () => void
  resetPreferences: () => void
  saveForLater: (productId: number, size: string) => void
  moveSavedToCart: (productId: number, size: string) => void
  removeSaved: (productId: number, size: string) => void
  addAddress: (address: NewAddress) => Address
  removeAddress: (id: string) => void
  setDefaultAddress: (id: string) => void
  applyCoupon: (code: string) => CouponResult
  removeCoupon: () => void
  placeOrder: (address: Address, paymentMethod: PaymentMethod) => Order | null
  cancelOrder: (orderId: string) => void
  cloudStatus: 'local' | 'syncing' | 'synced' | 'error'
  syncNow: () => Promise<void>
}

const ShopContext = createContext<ShopState | null>(null)

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

const STORAGE_OWNER_KEY = 'veloura_state_owner_v2'
const GUEST_OWNER = 'guest'
const STORAGE_KEYS = {
  cart: 'veloura_cart',
  wishlist: 'veloura_wishlist',
  recent: 'veloura_recent',
  saved: 'veloura_saved_for_later_v1',
  addresses: 'veloura_addresses_v1',
  orders: 'veloura_orders_v1',
  coupon: 'veloura_coupon_v1',
  preferences: 'veloura_preferences_v1',
} as const

type LocalCommerceSnapshot = {
  cart: CartItem[]
  savedForLater: CartItem[]
  wishlist: Product[]
  addresses: Address[]
  orders: Order[]
  recentlyViewed: Product[]
  preferenceSignals: PreferenceSignals
}

function emptySignals(): PreferenceSignals {
  return { categories: {}, brands: {}, colors: {}, occasions: {} }
}

function emptyLocalSnapshot(): LocalCommerceSnapshot {
  return { cart: [], savedForLater: [], wishlist: [], addresses: [], orders: [], recentlyViewed: [], preferenceSignals: emptySignals() }
}

function readStorageOwner() {
  try { return localStorage.getItem(STORAGE_OWNER_KEY) } catch { return null }
}

function writeStorageOwner(owner: string) {
  try { localStorage.setItem(STORAGE_OWNER_KEY, owner) } catch { /* browser storage unavailable */ }
}

function readGuestInitial<T>(key: string, fallback: T, sensitive = false): T {
  const owner = readStorageOwner()
  if (owner === GUEST_OWNER) return read(key, fallback)
  if (owner === null && !sensitive) return read(key, fallback)
  return fallback
}

function readLocalSnapshot(): LocalCommerceSnapshot {
  return {
    cart: read<CartItem[]>(STORAGE_KEYS.cart, []),
    savedForLater: read<CartItem[]>(STORAGE_KEYS.saved, []),
    wishlist: read<Product[]>(STORAGE_KEYS.wishlist, []),
    addresses: read<Address[]>(STORAGE_KEYS.addresses, []),
    orders: read<Order[]>(STORAGE_KEYS.orders, []),
    recentlyViewed: read<Product[]>(STORAGE_KEYS.recent, []),
    preferenceSignals: read<PreferenceSignals>(STORAGE_KEYS.preferences, emptySignals()),
  }
}

function guestIntentOnly(snapshot: LocalCommerceSnapshot): LocalCommerceSnapshot {
  return {
    ...snapshot,
    addresses: [],
    orders: [],
  }
}

function clearCommerceStorage() {
  try {
    Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key))
  } catch { /* browser storage unavailable */ }
}

export function ShopProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth()
  const [cart, setCart] = useState<CartItem[]>(() => readGuestInitial(STORAGE_KEYS.cart, []))
  const [wishlist, setWishlist] = useState<Product[]>(() => readGuestInitial(STORAGE_KEYS.wishlist, []))
  const [compare, setCompare] = useState<Product[]>(() => read('veloura_compare_v1', []))
  const [recentlyViewed, setRecentlyViewed] = useState<Product[]>(() => readGuestInitial(STORAGE_KEYS.recent, []))
  const [savedForLater, setSavedForLater] = useState<CartItem[]>(() => readGuestInitial(STORAGE_KEYS.saved, []))
  const [addresses, setAddresses] = useState<Address[]>(() => readGuestInitial(STORAGE_KEYS.addresses, [], true))
  const [orders, setOrders] = useState<Order[]>(() => readGuestInitial(STORAGE_KEYS.orders, [], true))
  const [couponCode, setCouponCode] = useState<string>(() => readGuestInitial(STORAGE_KEYS.coupon, ''))
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null)
  const [preferenceSignals, setPreferenceSignals] = useState<PreferenceSignals>(() => readGuestInitial(STORAGE_KEYS.preferences, EMPTY_PREFERENCE_SIGNALS))
  const [actionToast, setActionToast] = useState('')
  const [cloudStatus, setCloudStatus] = useState<'local'|'syncing'|'synced'|'error'>('local')
  const [storageReady, setStorageReady] = useState(false)
  const hydratedUserRef = useRef<string | null>(null)
  const cloudBlockedRef = useRef(false)

  useEffect(() => { if (storageReady) localStorage.setItem(STORAGE_KEYS.cart, JSON.stringify(cart)) }, [storageReady, cart])
  useEffect(() => { if (storageReady) localStorage.setItem(STORAGE_KEYS.wishlist, JSON.stringify(wishlist)) }, [storageReady, wishlist])
  useEffect(() => localStorage.setItem('veloura_compare_v1', JSON.stringify(compare)), [compare])
  useEffect(() => { if (storageReady) localStorage.setItem(STORAGE_KEYS.recent, JSON.stringify(recentlyViewed)) }, [storageReady, recentlyViewed])
  useEffect(() => { if (storageReady) localStorage.setItem(STORAGE_KEYS.preferences, JSON.stringify(preferenceSignals)) }, [storageReady, preferenceSignals])
  useEffect(() => { if (storageReady) localStorage.setItem(STORAGE_KEYS.saved, JSON.stringify(savedForLater)) }, [storageReady, savedForLater])
  useEffect(() => { if (storageReady) localStorage.setItem(STORAGE_KEYS.addresses, JSON.stringify(addresses)) }, [storageReady, addresses])
  useEffect(() => { if (storageReady) localStorage.setItem(STORAGE_KEYS.orders, JSON.stringify(orders)) }, [storageReady, orders])
  useEffect(() => { if (storageReady) localStorage.setItem(STORAGE_KEYS.coupon, JSON.stringify(couponCode)) }, [storageReady, couponCode])
  useEffect(() => {
    if (!actionToast) return
    const timer = window.setTimeout(() => setActionToast(''), 2200)
    return () => window.clearTimeout(timer)
  }, [actionToast])

  useEffect(() => {
    if (authLoading) return

    let cancelled = false
    const owner = readStorageOwner()
    const persisted = readLocalSnapshot()
    const persistedCoupon = read<string>(STORAGE_KEYS.coupon, '')

    const applySnapshot = (snapshot: LocalCommerceSnapshot) => {
      setCart(snapshot.cart)
      setSavedForLater(snapshot.savedForLater)
      setWishlist(snapshot.wishlist)
      setAddresses(snapshot.addresses)
      setOrders(snapshot.orders)
      setRecentlyViewed(snapshot.recentlyViewed)
      setPreferenceSignals(snapshot.preferenceSignals)
    }

    if (!user) {
      const safeGuest = owner === GUEST_OWNER ? persisted : guestIntentOnly(persisted)
      if (owner && owner !== GUEST_OWNER) clearCommerceStorage()
      if (owner === null) {
        try {
          localStorage.removeItem(STORAGE_KEYS.addresses)
          localStorage.removeItem(STORAGE_KEYS.orders)
        } catch { /* browser storage unavailable */ }
      }
      applySnapshot(owner && owner !== GUEST_OWNER ? emptyLocalSnapshot() : safeGuest)
      setCouponCode(owner && owner !== GUEST_OWNER ? '' : persistedCoupon)
      writeStorageOwner(GUEST_OWNER)
      hydratedUserRef.current = null
      cloudBlockedRef.current = false
      setCloudStatus('local')
      setStorageReady(true)
      return
    }

    setStorageReady(false)
    setCloudStatus('syncing')

    let localState: LocalCommerceSnapshot
    let localCoupon = ''
    if (owner === user.id) {
      localState = persisted
      localCoupon = persistedCoupon
    } else if (owner === GUEST_OWNER || owner === null) {
      localState = guestIntentOnly(persisted)
      localCoupon = persistedCoupon
    } else {
      clearCommerceStorage()
      localState = emptyLocalSnapshot()
    }

    writeStorageOwner(user.id)
    applySnapshot(localState)
    setCouponCode(localCoupon)

    loadCloudCommerce(user.id).then(async (cloud) => {
      if (cancelled) return
      const merged = mergeCommerceState(localState, cloud)
      hydratedUserRef.current = user.id
      cloudBlockedRef.current = false
      applySnapshot(merged)
      setStorageReady(true)
      try {
        await pushCloudCommerce(user.id, merged, {
          email: user.email,
          displayName: String(user.user_metadata?.display_name || user.user_metadata?.full_name || ''),
        })
        if (!cancelled) setCloudStatus('synced')
      } catch {
        if (!cancelled) {
          cloudBlockedRef.current = true
          setCloudStatus('error')
        }
      }
    }).catch(() => {
      if (cancelled) return
      hydratedUserRef.current = user.id
      cloudBlockedRef.current = true
      applySnapshot(localState)
      setStorageReady(true)
      setCloudStatus('error')
    })

    return () => { cancelled = true }
    // Cloud hydration should run once per authenticated identity.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, authLoading])


  const subtotal = useMemo(() => cart.reduce((sum, item) => sum + getProductPricing(item.product).selling * item.quantity, 0), [cart])
  const coupon = useMemo<CouponResult | null>(() => couponCode ? evaluateCoupon(couponCode, subtotal, orders.length) : null, [couponCode, subtotal, orders.length])

  useEffect(() => {
    if (couponCode && coupon && !coupon.ok) setCouponCode('')
  }, [couponCode, coupon])

  const recordSignal = useCallback((product: Product, weight = 1) => setPreferenceSignals((current) => addProductSignal(current, product, weight)), [])

  const addToCart = useCallback((product: Product, size = 'M', quantity = 1) => {
    if (product.stock === 0) {
      setActionToast('This item is currently sold out')
      return
    }
    setCart((items) => {
      const existing = items.find((item) => item.product.id === product.id && item.size === size)
      if (existing) return items.map((item) => item.product.id === product.id && item.size === size ? { ...item, quantity: item.quantity + quantity } : item)
      return [...items, { product, size, quantity }]
    })
    recordSignal(product, 3)
    setActionToast(`${product.title} added to bag`)
    if (user) recordCommerceEvent(user.id, 'add_to_bag', { productId: product.id }).catch(() => undefined)
  }, [recordSignal, user])

  const removeFromCart = useCallback((productId: number, size?: string) => setCart((items) => items.filter((item) => !(item.product.id === productId && (!size || item.size === size)))), [])
  const updateQuantity = useCallback((productId: number, size: string, quantity: number) => {
    if (quantity < 1) return setCart((items) => items.filter((item) => !(item.product.id === productId && item.size === size)))
    setCart((items) => items.map((item) => item.product.id === productId && item.size === size ? { ...item, quantity } : item))
  }, [])

  const toggleWishlist = useCallback((product: Product) => setWishlist((items) => {
    const exists = items.some((p) => p.id === product.id)
    if (exists) {
      setActionToast('Removed from wishlist')
      return items.filter((p) => p.id !== product.id)
    }
    recordSignal(product, 2)
    setActionToast(`${product.title} saved to wishlist`)
    if (user) recordCommerceEvent(user.id, 'wishlist_add', { productId: product.id }).catch(() => undefined)
    return [...items, product]
  }), [recordSignal, user])

  const toggleCompare = useCallback((product: Product) => {
    setCompare((items) => {
      const exists = items.some((item) => item.id === product.id)
      if (exists) {
        setActionToast('Removed from compare')
        return items.filter((item) => item.id !== product.id)
      }
      if (items.length >= 4) {
        setActionToast('Compare up to 4 products at a time')
        return items
      }
      setActionToast(`${product.title} added to compare`)
      return [...items, product]
    })
  }, [])

  const clearCompare = useCallback(() => {
    setCompare([])
    setActionToast('Compare list cleared')
  }, [])

  const recordRecentlyViewed = useCallback((product: Product) => setRecentlyViewed((items) => {
    const next = [product, ...items.filter((item) => item.id !== product.id)].slice(0, 18)
    if (items.length === next.length && items.every((item, index) => item.id === next[index]?.id)) return items
    return next
  }), [])

  const recordRecentlyViewedWithSignal = useCallback((product: Product) => {
    recordRecentlyViewed(product)
    recordSignal(product, 1)
  }, [recordRecentlyViewed, recordSignal])

  const openQuickView = useCallback((product: Product) => { setQuickViewProduct(product); recordSignal(product, .6) }, [recordSignal])
  const closeQuickView = useCallback(() => setQuickViewProduct(null), [])
  const clearCart = useCallback(() => setCart([]), [])
  const resetPreferences = useCallback(() => {
    setPreferenceSignals({ categories: {}, brands: {}, colors: {}, occasions: {} })
    setActionToast('Style preferences reset')
  }, [])

  const saveForLater = useCallback((productId: number, size: string) => {
    const item = cart.find((entry) => entry.product.id === productId && entry.size === size)
    if (!item) return
    setSavedForLater((saved) => {
      const existing = saved.find((entry) => entry.product.id === productId && entry.size === size)
      return existing ? saved : [...saved, item]
    })
    setCart((items) => items.filter((entry) => !(entry.product.id === productId && entry.size === size)))
    setActionToast('Saved for later')
  }, [cart])

  const moveSavedToCart = useCallback((productId: number, size: string) => {
    const item = savedForLater.find((entry) => entry.product.id === productId && entry.size === size)
    if (!item) return
    if (item.product.stock === 0) {
      setActionToast('This saved item is currently sold out')
      return
    }
    setCart((cartItems) => {
      const existing = cartItems.find((entry) => entry.product.id === productId && entry.size === size)
      if (existing) return cartItems.map((entry) => entry.product.id === productId && entry.size === size ? { ...entry, quantity: entry.quantity + item.quantity } : entry)
      return [...cartItems, item]
    })
    setSavedForLater((items) => items.filter((entry) => !(entry.product.id === productId && entry.size === size)))
    setActionToast('Moved back to bag')
  }, [savedForLater])

  const removeSaved = useCallback((productId: number, size: string) => {
    setSavedForLater((items) => items.filter((entry) => !(entry.product.id === productId && entry.size === size)))
  }, [])

  const addAddress = useCallback((input: NewAddress) => {
    const address: Address = { ...input, id: createAddressId(), createdAt: new Date().toISOString(), isDefault: input.isDefault || addresses.length === 0 }
    setAddresses((current) => {
      const normalized = address.isDefault ? current.map((item) => ({ ...item, isDefault: false })) : current
      return [address, ...normalized]
    })
    return address
  }, [addresses.length])

  const removeAddress = useCallback((id: string) => setAddresses((current) => {
    const next = current.filter((item) => item.id !== id)
    if (next.length && !next.some((item) => item.isDefault)) next[0] = { ...next[0], isDefault: true }
    return next
  }), [])

  const setDefaultAddress = useCallback((id: string) => setAddresses((current) => current.map((item) => ({ ...item, isDefault: item.id === id }))), [])

  const applyCoupon = useCallback((code: string) => {
    const result = evaluateCoupon(code, subtotal, orders.length)
    if (result.ok) {
      setCouponCode(result.code)
      setActionToast(`${result.code} applied`)
    } else {
      setCouponCode('')
    }
    return result
  }, [subtotal, orders.length])

  const removeCoupon = useCallback(() => {
    setCouponCode('')
    setActionToast('Coupon removed')
  }, [])

  const placeOrder = useCallback((address: Address, paymentMethod: PaymentMethod) => {
    if (!cart.length) return null
    const currentCoupon = couponCode ? evaluateCoupon(couponCode, subtotal, orders.length) : null
    const totals = totalsFor(subtotal, currentCoupon)
    const order: Order = {
      id: createOrderId(),
      createdAt: new Date().toISOString(),
      status: 'placed',
      items: cloneCart(cart),
      subtotal: totals.subtotal,
      discount: totals.discount,
      delivery: totals.delivery,
      total: totals.total,
      couponCode: currentCoupon?.ok ? currentCoupon.code : undefined,
      paymentMethod,
      address,
    }
    setOrders((current) => [order, ...current])
    setCart([])
    setCouponCode('')
    setActionToast(`Order ${order.id} placed`)
    if (user) recordCommerceEvent(user.id, 'order_placed', { orderNumber: order.id, metadata: { total: order.total, paymentMethod } }).catch(() => undefined)
    return order
  }, [cart, couponCode, subtotal, orders.length, user])

  const cancelOrder = useCallback((orderId: string) => {
    setOrders((current) => current.map((order) => {
      if (order.id !== orderId || !['placed','confirmed'].includes(order.status)) return order
      return { ...order, status: 'cancelled' as const }
    }))
    setActionToast('Order cancelled')
  }, [])

  const syncNow = useCallback(async () => {
    if (!user || hydratedUserRef.current !== user.id) return
    setCloudStatus('syncing')
    try {
      await pushCloudCommerce(user.id, {
        cart, savedForLater, wishlist, addresses, orders, recentlyViewed, preferenceSignals,
      }, {
        email: user.email,
        displayName: String(user.user_metadata?.display_name || user.user_metadata?.full_name || ''),
      })
      cloudBlockedRef.current = false
      setCloudStatus('synced')
    } catch {
      cloudBlockedRef.current = true
      setCloudStatus('error')
    }
  }, [user, cart, savedForLater, wishlist, addresses, orders, recentlyViewed, preferenceSignals])

  useEffect(() => {
    if (!storageReady || !user || hydratedUserRef.current !== user.id || cloudBlockedRef.current) return
    setCloudStatus('syncing')
    const timer = window.setTimeout(() => {
      syncNow().catch(() => undefined)
    }, 700)
    return () => window.clearTimeout(timer)
  }, [storageReady, user?.id, cart, savedForLater, wishlist, addresses, orders, recentlyViewed, preferenceSignals, syncNow])

  const value = useMemo(() => ({
    cart, wishlist, compare, recentlyViewed, savedForLater, addresses, orders, quickViewProduct, preferenceSignals, actionToast, coupon,
    addToCart, removeFromCart, updateQuantity, toggleWishlist, toggleCompare, clearCompare, recordRecentlyViewed: recordRecentlyViewedWithSignal, openQuickView, closeQuickView,
    isWishlisted: (productId: number) => wishlist.some((p) => p.id === productId),
    isCompared: (productId: number) => compare.some((p) => p.id === productId),
    cartCount: cart.reduce((sum, item) => sum + item.quantity, 0),
    subtotal,
    clearCart, resetPreferences, saveForLater, moveSavedToCart, removeSaved,
    addAddress, removeAddress, setDefaultAddress, applyCoupon, removeCoupon, placeOrder, cancelOrder, cloudStatus, syncNow,
  }), [cart, wishlist, compare, recentlyViewed, savedForLater, addresses, orders, quickViewProduct, preferenceSignals, actionToast, coupon, subtotal, addToCart, removeFromCart, updateQuantity, toggleWishlist, toggleCompare, clearCompare, recordRecentlyViewedWithSignal, openQuickView, closeQuickView, clearCart, resetPreferences, saveForLater, moveSavedToCart, removeSaved, addAddress, removeAddress, setDefaultAddress, applyCoupon, removeCoupon, placeOrder, cancelOrder, cloudStatus, syncNow])

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>
}

export function useShop() {
  const context = useContext(ShopContext)
  if (!context) throw new Error('useShop must be used inside ShopProvider')
  return context
}
