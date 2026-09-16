import { ArrowLeft, Search } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return <div className="not-found-page container">
    <span className="not-found-mark">V</span>
    <span className="eyebrow">404 · VELOURA</span>
    <h1>This page slipped out of the edit.</h1>
    <p>The link may have moved, expired, or never existed.</p>
    <div><Link className="button primary" to="/"><ArrowLeft size={16}/> Back home</Link><Link className="button outline" to="/shop"><Search size={16}/> Browse the store</Link></div>
  </div>
}
