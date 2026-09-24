import { lazy, Suspense, type ReactNode } from 'react'
import { Route, Routes } from 'react-router-dom'
import ErrorBoundary from './components/ErrorBoundary'
import Layout from './components/Layout'
import PageLoader from './components/PageLoader'

const HomePage = lazy(() => import('./pages/HomePage'))
const ShopPage = lazy(() => import('./pages/ShopPage'))
const ProductPage = lazy(() => import('./pages/ProductPage'))
const WishlistPage = lazy(() => import('./pages/WishlistPage'))
const CartPage = lazy(() => import('./pages/CartPage'))
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'))
const AccountPage = lazy(() => import('./pages/AccountPage'))
const AuthPage = lazy(() => import('./pages/AuthPage'))
const OrdersPage = lazy(() => import('./pages/OrdersPage'))
const OrderDetailPage = lazy(() => import('./pages/OrderDetailPage'))
const TrackOrderPage = lazy(() => import('./pages/TrackOrderPage'))
const CatalogControlPage = lazy(() => import('./pages/CatalogControlPage'))
const HelpPage = lazy(() => import('./pages/HelpPage'))
const BrandPage = lazy(() => import('./pages/BrandPage'))
const EditPage = lazy(() => import('./pages/EditPage'))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'))

const page = (element: ReactNode) => <ErrorBoundary><Suspense fallback={<PageLoader />}>{element}</Suspense></ErrorBoundary>

export default function App() {
  return <Routes><Route element={<Layout />}><Route index element={page(<HomePage />)} /><Route path="shop" element={page(<ShopPage />)} /><Route path="product/:id" element={page(<ProductPage />)} /><Route path="wishlist" element={page(<WishlistPage />)} /><Route path="cart" element={page(<CartPage />)} /><Route path="checkout" element={page(<CheckoutPage />)} /><Route path="account" element={page(<AccountPage />)} /><Route path="login" element={page(<AuthPage />)} /><Route path="orders" element={page(<OrdersPage />)} /><Route path="order/:orderId" element={page(<OrderDetailPage />)} /><Route path="track-order" element={page(<TrackOrderPage />)} /><Route path="catalog-control" element={page(<CatalogControlPage />)} /><Route path="brand/:brand" element={page(<BrandPage />)} /><Route path="edits" element={page(<EditPage />)} /><Route path="edit/:slug" element={page(<EditPage />)} /><Route path="help/:slug" element={page(<HelpPage />)} /><Route path="*" element={page(<NotFoundPage />)} /></Route></Routes>
}
