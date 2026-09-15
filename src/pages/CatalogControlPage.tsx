import { Activity, Database, Images, Layers3, RefreshCw, ShieldCheck } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { WOMEN_CATEGORIES, categoryLabel } from '../data/catalog'
import { clearCatalogCache, fetchCatalog, fetchCategoryCatalog, getCatalogDiagnostics } from '../lib/api'
import type { ProviderHealth } from '../lib/catalog/manager'
import type { Product } from '../types'

const DEPARTMENT_TARGET = 100

export default function CatalogControlPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [health, setHealth] = useState<ProviderHealth[]>([])
  const [loading, setLoading] = useState(true)
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null)
  const [auditCategory, setAuditCategory] = useState('womens-dresses')
  const [auditProducts, setAuditProducts] = useState<Product[]>([])
  const [auditLoading, setAuditLoading] = useState(false)

  const refresh = useCallback(async () => {
    setLoading(true)
    clearCatalogCache()
    const catalog = await fetchCatalog()
    setProducts(catalog)
    setHealth(getCatalogDiagnostics())
    setUpdatedAt(new Date())
    setLoading(false)
  }, [])

  const auditDepartment = useCallback(async (category: string) => {
    setAuditLoading(true)
    try {
      const items = await fetchCategoryCatalog(category)
      setAuditProducts(items.filter((product) => product.category === category))
    } finally {
      setAuditLoading(false)
    }
  }, [])

  useEffect(() => { void refresh() }, [refresh])
  useEffect(() => { void auditDepartment(auditCategory) }, [auditCategory, auditDepartment])

  const stats = useMemo(() => {
    const categories = new Map<string, number>()
    const sources = new Map<string, number>()
    let multiImage = 0
    products.forEach((product) => {
      categories.set(product.category, (categories.get(product.category) || 0) + 1)
      sources.set(product.sourceLabel || product.source || 'Unknown', (sources.get(product.sourceLabel || product.source || 'Unknown') || 0) + 1)
      if ((product.images?.length || 0) >= 2) multiImage += 1
    })
    return { categories, sources, multiImage }
  }, [products])

  const auditStats = useMemo(() => {
    const sources = new Map<string, number>()
    let galleries = 0
    auditProducts.forEach((product) => {
      sources.set(product.sourceLabel || product.source || 'Unknown', (sources.get(product.sourceLabel || product.source || 'Unknown') || 0) + 1)
      if ((product.images?.length || 0) >= 2) galleries += 1
    })
    return { sources, galleries }
  }, [auditProducts])

  const readyProviders = health.filter((provider) => provider.status === 'ready').length
  const failedProviders = health.filter((provider) => provider.status === 'failed').length
  const coveredCategories = WOMEN_CATEGORIES.filter((category) => (stats.categories.get(category.value) || 0) > 0).length
  const auditPass = auditProducts.length >= DEPARTMENT_TARGET

  return <div className="catalog-control container-wide">
    <div className="control-hero">
      <div><span className="eyebrow">VELOURA INTERNAL</span><h1>Catalog Control</h1><p>Live visibility into every women’s catalog source, quality gate and department.</p></div>
      <button className="button primary" onClick={refresh} disabled={loading}><RefreshCw size={16} className={loading ? 'spin' : ''}/>{loading ? 'Refreshing…' : 'Refresh all sources'}</button>
    </div>

    <section className="control-stat-grid">
      <Stat icon={<Database/>} label="Unique base products" value={loading ? '—' : products.length.toLocaleString('en-IN')} />
      <Stat icon={<Activity/>} label="Healthy providers" value={loading ? '—' : `${readyProviders}/${health.filter((p) => p.id !== 'curated').length}`} tone={failedProviders ? 'warn' : 'good'} />
      <Stat icon={<Layers3/>} label="Departments live" value={loading ? '—' : `${coveredCategories}/${WOMEN_CATEGORIES.length}`} />
      <Stat icon={<Images/>} label="Multi-image products" value={loading ? '—' : stats.multiImage.toLocaleString('en-IN')} />
    </section>

    <section className="control-panel department-audit">
      <div className="control-panel-head"><div><span className="eyebrow">DEEP CATALOG QA</span><h2>100-style department target</h2></div><label className="audit-select">Audit <select value={auditCategory} onChange={(event) => setAuditCategory(event.target.value)}>{WOMEN_CATEGORIES.map((category) => <option key={category.value} value={category.value}>{category.label}</option>)}</select></label></div>
      <div className="audit-meter-row"><div className={`audit-score ${auditLoading ? 'loading' : auditPass ? 'pass' : 'warn'}`}><span>{categoryLabel(auditCategory)}</span><strong>{auditLoading ? '…' : auditProducts.length}</strong><small>/ {DEPARTMENT_TARGET} target</small></div><div className="audit-bar"><i style={{width:`${Math.min(100,(auditProducts.length/DEPARTMENT_TARGET)*100)}%`}}/><span>{auditPass ? 'Target reached' : `${Math.max(0,DEPARTMENT_TARGET-auditProducts.length)} more usable styles needed`}</span></div><div className="audit-mini"><span>Real galleries</span><strong>{auditLoading ? '—' : auditStats.galleries}</strong></div></div>
      {!auditLoading && <div className="audit-source-chips">{[...auditStats.sources.entries()].sort((a,b)=>b[1]-a[1]).map(([source,count]) => <span key={source}><b>{count}</b> {source}</span>)}</div>}
      {!auditLoading && auditProducts.length > 0 && <div className="audit-sample-strip">{auditProducts.slice(0,8).map((product) => <img key={product.id} src={product.thumbnail} alt={product.title} title={`${product.brand || 'Veloura'} — ${product.title}`}/>)}</div>}
    </section>

    <section className="control-panel">
      <div className="control-panel-head"><div><span className="eyebrow">PROVIDER HEALTH</span><h2>Managed feeds</h2></div>{updatedAt && <small>Last checked {updatedAt.toLocaleTimeString()}</small>}</div>
      <div className="provider-table">
        <div className="provider-row provider-header"><span>Provider</span><span>Status</span><span>Raw items</span><span>Latency</span><span>Notes</span></div>
        {health.map((provider) => <div className="provider-row" key={`${provider.id}-${provider.label}`}><strong>{provider.label}</strong><span className={`provider-status ${provider.status}`}>{provider.status === 'ready' ? <ShieldCheck size={14}/> : null}{provider.status}</span><b>{provider.count.toLocaleString('en-IN')}</b><span>{provider.durationMs} ms</span><small>{provider.message || 'Connected'}</small></div>)}
      </div>
    </section>

    <section className="control-split">
      <div className="control-panel"><div className="control-panel-head"><div><span className="eyebrow">BASE COVERAGE</span><h2>Women’s departments</h2></div></div><div className="coverage-grid">{WOMEN_CATEGORIES.map((category) => { const count = stats.categories.get(category.value) || 0; return <button onClick={() => setAuditCategory(category.value)} className={count ? 'coverage-card live' : 'coverage-card'} key={category.value}><span>{category.label}</span><strong>{count}</strong></button> })}</div></div>
      <div className="control-panel"><div className="control-panel-head"><div><span className="eyebrow">AFTER QUALITY GATES</span><h2>Source mix</h2></div></div><div className="source-mix">{[...stats.sources.entries()].sort((a,b) => b[1]-a[1]).map(([source,count]) => <div key={source}><span>{source}</span><strong>{count}</strong></div>)}</div><p className="control-note">Counts shown here are after women-only filtering, broken-image rejection, identity dedupe and primary-image dedupe. Deep department audits add focused paginated sources on demand.</p></div>
    </section>

    {!loading && products.length > 0 && <section className="control-panel"><div className="control-panel-head"><div><span className="eyebrow">SAMPLE</span><h2>Catalog quality spot-check</h2></div></div><div className="control-samples">{products.slice(0,12).map((product) => <div key={product.id}><img src={product.thumbnail} alt=""/><strong>{product.brand || 'Veloura'}</strong><span>{product.title}</span><small>{categoryLabel(product.category)} · {product.images.length} image{product.images.length === 1 ? '' : 's'}</small></div>)}</div></section>}
  </div>
}

function Stat({ icon, label, value, tone = '' }: { icon: ReactNode; label: string; value: string; tone?: string }) {
  return <div className={`control-stat ${tone}`}>{icon}<div><span>{label}</span><strong>{value}</strong></div></div>
}
