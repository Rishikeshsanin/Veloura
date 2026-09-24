import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { CartItem, Product } from '../types'
import { getProductPricing } from '../lib/money'
import { addProductSignal, EMPTY_PREFERENCE_SIGNALS, type PreferenceSignals } from '../lib/personalization'
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

export function ShopProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>(() => read('veloura_cart', []))
  const [wishlist, setWishlist] = useState<Product[]>(() => read('veloura_wishlist', []))
  const [recentlyViewed, setRecentlyViewed] = useState<Product[]>(() => read('veloura_recent', []))
  const [savedForLater, setSavedForLater] = useState<CartItem[]>(() => read('veloura_saved_for_later_v1', []))
  const [addresses, setAddresses] = useState<Address[]>(() => read('veloura_addresses_v1', []))
  const [orders, setOrders] = useState<Order[]>(() => read('veloura_orders_v1', []))
  const [couponCode, setCouponCode] = useState<string>(() => read('veloura_coupon_v1', ''))
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null)
  const [preferenceSignals, setPreferenceSignals] = useState<PreferenceSignals>(() => read('veloura_preferences_v1', EMPTY_PREFERENCE_SIGNALS))
  const [actionToast, setActionToast] = useState('')

  useEffect(() => localStorage.setItem('veloura_cart', JSON.stringify(cart)), [cart])
  useEffect(() => localStorage.setItem('veloura_wishlist', JSON.stringify(wishlist)), [wishlist])
  useEffect(() => localStorage.setItem('veloura_recent', JSON.stringify(recentlyViewed)), [recentlyViewed])
  useEffect(() => localStorage.setItem('veloura_preferences_v1', JSON.stringify(preferenceSignals)), [preferenceSignals])
  useEffect(() => localStorage.setItem('veloura_saved_for_later_v1', JSON.stringify(savedForLater)), [savedForLater])
  useEffect(() => localStorage.setItem('veloura_addresses_v1', JSON.stringify(addresses)), [addresses])
  useEffect(() => localStorage.setItem('veloura_orders_v1', JSON.stringify(orders)), [orders])
  useEffect(() => localStorage.setItem('veloura_coupon_v1', JSON.stringify(couponCode)), [couponCode])
  useEffect(() => {
    if (!actionToast) return
    const timer = window.setTimeout(() => setActionToast(''), 2200)
    return () => window.clearTimeout(timer)
  }, [actionToast])

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
  }, [recordSignal])

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
    return [...items, product]
  }), [recordSignal])

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
    setCart((items) => {
      const item = items.find((entry) => entry.product.id === productId && entry.size === size)
      if (!item) return items
      setSavedForLater((saved) => {
        const existing = saved.find((entry) => entry.product.id === productId && entry.size === size)
        return existing ? saved : [...saved, item]
      })
      return items.filter((entry) => !(entry.product.id === productId && entry.size === size))
    })
    setActionToast('Saved for later')
  }, [])

  const moveSavedToCart = useCallback((productId: number, size: string) => {
    setSavedForLater((items) => {
      const item = items.find((entry) => entry.product.id === productId && entry.size === size)
      if (!item) return items
      if (item.product.stock === 0) {
        setActionToast('This saved item is currently sold out')
        return items
      }
      setCart((cartItems) => {
        const existing = cartItems.find((entry) => entry.product.id === productId && entry.size === size)
        if (existing) return cartItems.map((entry) => entry.product.id === productId && entry.size === size ? { ...entry, quantity: entry.quantity + item.quantity } : entry)
        return [...cartItems, item]
      })
      setActionToast('Moved back to bag')
      return items.filter((entry) => !(entry.product.id === productId && entry.size === size))
    })
  }, [])

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
    return order
  }, [cart, couponCode, subtotal, orders.length])

  const value = useMemo(() => ({
    cart, wishlist, recentlyViewed, savedForLater, addresses, orders, quickViewProduct, preferenceSignals, actionToast, coupon,
    addToCart, removeFromCart, updateQuantity, toggleWishlist, recordRecentlyViewed: recordRecentlyViewedWithSignal, openQuickView, closeQuickView,
    isWishlisted: (productId: number) => wishlist.some((p) => p.id === productId),
    cartCount: cart.reduce((sum, item) => sum + item.quantity, 0),
    subtotal,
    clearCart, resetPreferences, saveForLater, moveSavedToCart, removeSaved,
    addAddress, removeAddress, setDefaultAddress, applyCoupon, removeCoupon, placeOrder,
  }), [cart, wishlist, recentlyViewed, savedForLater, addresses, orders, quickViewProduct, preferenceSignals, actionToast, coupon, subtotal, addToCart, removeFromCart, updateQuantity, toggleWishlist, recordRecentlyViewedWithSignal, openQuickView, closeQuickView, clearCart, resetPreferences, saveForLater, moveSavedToCart, removeSaved, addAddress, removeAddress, setDefaultAddress, applyCoupon, removeCoupon, placeOrder])

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>
}

export function useShop() {
  const context = useContext(ShopContext)
  if (!context) throw new Error('useShop must be used inside ShopProvider')
  return context
}
