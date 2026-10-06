import { readSiteData } from '@/lib/site-data'

export async function GET() {
  try {
    const { estimatorRates } = await readSiteData()
    return Response.json({ config: estimatorRates })
  } catch (error) {
    console.error('Failed to load estimator configuration', error)
    return Response.json({ error: 'Estimator details are temporarily unavailable.' }, { status: 503 })
  }
}
