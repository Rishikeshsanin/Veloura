import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { ShopProvider } from './store/ShopContext'
import { AuthProvider } from './store/AuthContext'
import './styles.css'

createRoot(document.getElementById('root')!).render(<StrictMode><BrowserRouter><AuthProvider><ShopProvider><App /></ShopProvider></AuthProvider></BrowserRouter></StrictMode>)
