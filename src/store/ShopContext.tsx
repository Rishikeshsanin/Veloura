import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { CartItem, Product } from '../types'
import { getProductPricing } from '../lib/money'

type ShopState = {
  cart: CartItem[]
  wishlist: Product[]
  addToCart: (product: Product, size?: string, quantity?: number) => void
  removeFromCart: (productId: number, size?: string) => void
  updateQuantity: (productId: number, size: string, quantity: number) => void
  toggleWishlist: (product: Product) => void
  isWishlisted: (productId: number) => boolean
  cartCount: number
  subtotal: number
  clearCart: () => void
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

  useEffect(() => localStorage.setItem('veloura_cart', JSON.stringify(cart)), [cart])
  useEffect(() => localStorage.setItem('veloura_wishlist', JSON.stringify(wishlist)), [wishlist])

  const addToCart = (product: Product, size = 'M', quantity = 1) => {
    setCart((items) => {
      const existing = items.find((item) => item.product.id === product.id && item.size === size)
      if (existing) return items.map((item) => item.product.id === product.id && item.size === size ? { ...item, quantity: item.quantity + quantity } : item)
      return [...items, { product, size, quantity }]
    })
  }

  const removeFromCart = (productId: number, size?: string) => setCart((items) => items.filter((item) => !(item.product.id === productId && (!size || item.size === size))))
  const updateQuantity = (productId: number, size: string, quantity: number) => {
    if (quantity < 1) return removeFromCart(productId, size)
    setCart((items) => items.map((item) => item.product.id === productId && item.size === size ? { ...item, quantity } : item))
  }
  const toggleWishlist = (product: Product) => setWishlist((items) => items.some((p) => p.id === product.id) ? items.filter((p) => p.id !== product.id) : [...items, product])

  const value = useMemo(() => ({
    cart, wishlist, addToCart, removeFromCart, updateQuantity, toggleWishlist,
    isWishlisted: (productId: number) => wishlist.some((p) => p.id === productId),
    cartCount: cart.reduce((sum, item) => sum + item.quantity, 0),
    subtotal: cart.reduce((sum, item) => sum + getProductPricing(item.product).selling * item.quantity, 0),
    clearCart: () => setCart([]),
  }), [cart, wishlist])

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>
}

export function useShop() {
  const context = useContext(ShopContext)
  if (!context) throw new Error('useShop must be used inside ShopProvider')
  return context
}
