export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST')
    return response.status(405).json({ error: 'Method not allowed' })
  }

  const store = String(request.query?.store || '').toLowerCase().trim()
  if (!/^[a-z0-9-]{1,48}$/.test(store)) {
    return response.status(400).json({ error: 'Invalid mock.shop store' })
  }

  try {
    const upstream = await fetch(`https://${store}.mock.shop/api`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(request.body || {}),
    })

    const text = await upstream.text()
    response.setHeader('Content-Type', upstream.headers.get('content-type') || 'application/json')
    response.setHeader('Cache-Control', 's-maxage=900, stale-while-revalidate=3600')
    return response.status(upstream.status).send(text)
  } catch (error) {
    return response.status(502).json({ error: error instanceof Error ? error.message : 'Mock catalog upstream failed' })
  }
}
