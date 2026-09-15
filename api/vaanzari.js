export default async function handler(request, response) {
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET')
    return response.status(405).json({ error: 'Method not allowed' })
  }

  const requestUrl = new URL(request.url || '/', 'https://veloura.local')
  const params = new URLSearchParams()
  const allowed = ['limit', 'page', 'offset', 'cursor', 'q', 'search', 'occasion', 'material', 'technique', 'color']
  for (const key of allowed) {
    const value = requestUrl.searchParams.get(key)
    if (value?.trim()) params.set(key, value.trim())
  }
  if (!params.has('limit')) params.set('limit', '100')

  try {
    const upstream = await fetch(`https://vaanzari.com/api/sarees?${params.toString()}`, {
      headers: { Accept: 'application/json', 'User-Agent': 'Veloura-Catalog/1.0' },
    })
    const text = await upstream.text()
    response.setHeader('Content-Type', upstream.headers.get('content-type') || 'application/json')
    response.setHeader('Cache-Control', 's-maxage=900, stale-while-revalidate=3600')
    return response.status(upstream.status).send(text)
  } catch (error) {
    return response.status(502).json({ error: error instanceof Error ? error.message : 'Vaanzari upstream failed' })
  }
}
