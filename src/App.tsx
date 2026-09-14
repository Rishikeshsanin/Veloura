import { Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import AccountPage from './pages/AccountPage'
import CartPage from './pages/CartPage'
import CheckoutPage from './pages/CheckoutPage'
import HomePage from './pages/HomePage'
import ProductPage from './pages/ProductPage'
import ShopPage from './pages/ShopPage'
import WishlistPage from './pages/WishlistPage'

export default function App() {
  return <Routes><Route element={<Layout />}><Route index element={<HomePage />} /><Route path="shop" element={<ShopPage />} /><Route path="product/:id" element={<ProductPage />} /><Route path="wishlist" element={<WishlistPage />} /><Route path="cart" element={<CartPage />} /><Route path="checkout" element={<CheckoutPage />} /><Route path="account" element={<AccountPage />} /><Route path="*" element={<HomePage />} /></Route></Routes>
}
