import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import PageLoader from './components/PageLoader'

const HomePage = lazy(() => import('./pages/HomePage'))
const ShopPage = lazy(() => import('./pages/ShopPage'))
const ProductPage = lazy(() => import('./pages/ProductPage'))
const WishlistPage = lazy(() => import('./pages/WishlistPage'))
const CartPage = lazy(() => import('./pages/CartPage'))
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'))
const AccountPage = lazy(() => import('./pages/AccountPage'))
const CatalogControlPage = lazy(() => import('./pages/CatalogControlPage'))

const page = (element: React.ReactNode) => <Suspense fallback={<PageLoader />}>{element}</Suspense>

export default function App() {
  return <Routes><Route element={<Layout />}><Route index element={page(<HomePage />)} /><Route path="shop" element={page(<ShopPage />)} /><Route path="product/:id" element={page(<ProductPage />)} /><Route path="wishlist" element={page(<WishlistPage />)} /><Route path="cart" element={page(<CartPage />)} /><Route path="checkout" element={page(<CheckoutPage />)} /><Route path="account" element={page(<AccountPage />)} /><Route path="catalog-control" element={page(<CatalogControlPage />)} /><Route path="*" element={page(<HomePage />)} /></Route></Routes>
}
