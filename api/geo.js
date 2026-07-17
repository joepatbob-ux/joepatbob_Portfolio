// Echoes Vercel's IP-geolocation request headers back to the client so
// session-state analytics can carry state/city — the Web Analytics dashboard
// only breaks geography down to country on its own. Values like the city name
// arrive percent-encoded; region is the ISO 3166-2 code (e.g. "TX").
// Headers are only populated on real deployments — locally this returns nulls.
export default function handler(req, res) {
  const header = (name) => {
    const value = req.headers[name]
    const raw = Array.isArray(value) ? value[0] : value
    if (!raw) return null
    try {
      return decodeURIComponent(raw)
    } catch {
      return raw
    }
  }
  res.setHeader('Cache-Control', 'private, no-store')
  res.status(200).json({
    country: header('x-vercel-ip-country'),
    region: header('x-vercel-ip-country-region'),
    city: header('x-vercel-ip-city'),
  })
}
