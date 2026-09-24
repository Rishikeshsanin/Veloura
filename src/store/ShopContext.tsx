import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { CartItem, Product } from '../types'
import { getProductPricing } from '../lib/money'
import { addProductSignal, EMPTY_PREFERENCE_SIGNALS, type PreferenceSignals } from '../lib/personalization'

type ShopState = {
  cart: CartItem[]
  wishlist: Product[]
  recentlyViewed: Product[]
  quickViewProduct: Product | null
  preferenceSignals: PreferenceSignals
  actionToast: string
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
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null)
  const [preferenceSignals, setPreferenceSignals] = useState<PreferenceSignals>(() => read('veloura_preferences_v1', EMPTY_PREFERENCE_SIGNALS))
  const [actionToast, setActionToast] = useState('')

  useEffect(() => localStorage.setItem('veloura_cart', JSON.stringify(cart)), [cart])
  useEffect(() => localStorage.setItem('veloura_wishlist', JSON.stringify(wishlist)), [wishlist])
  useEffect(() => localStorage.setItem('veloura_recent', JSON.stringify(recentlyViewed)), [recentlyViewed])
  useEffect(() => localStorage.setItem('veloura_preferences_v1', JSON.stringify(preferenceSignals)), [preferenceSignals])
  useEffect(() => {
    if (!actionToast) return
    const timer = window.setTimeout(() => setActionToast(''), 2200)
    return () => window.clearTimeout(timer)
  }, [actionToast])

  const recordSignal = useCallback((product: Product, weight = 1) => setPreferenceSignals((current) => addProductSignal(current, product, weight)), [])

  const addToCart = useCallback((product: Product, size = 'M', quantity = 1) => {
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

  const value = useMemo(() => ({
    cart, wishlist, recentlyViewed, quickViewProduct, preferenceSignals, actionToast,
    addToCart, removeFromCart, updateQuantity, toggleWishlist, recordRecentlyViewed: recordRecentlyViewedWithSignal, openQuickView, closeQuickView,
    isWishlisted: (productId: number) => wishlist.some((p) => p.id === productId),
    cartCount: cart.reduce((sum, item) => sum + item.quantity, 0),
    subtotal: cart.reduce((sum, item) => sum + getProductPricing(item.product).selling * item.quantity, 0),
    clearCart, resetPreferences,
  }), [cart, wishlist, recentlyViewed, quickViewProduct, preferenceSignals, actionToast, addToCart, removeFromCart, updateQuantity, toggleWishlist, recordRecentlyViewedWithSignal, openQuickView, closeQuickView, clearCart, resetPreferences])

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>
}

export function useShop() {
  const context = useContext(ShopContext)
  if (!context) throw new Error('useShop must be used inside ShopProvider')
  return context
}
