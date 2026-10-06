import { z } from 'zod'
import { pool } from '@/lib/db'

const searchSchema = z.object({
  query: z.string().trim().min(2).max(200),
})

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const parsed = searchSchema.safeParse({ query: searchParams.get('query') ?? '' })
  if (!parsed.success) {
    return Response.json({ error: 'Enter an area, village or pincode to check.' }, { status: 400 })
  }

  try {
    const result = await pool.query<{ name: string }>(
      `SELECT "name" FROM "ServiceArea"
       WHERE lower("name") = lower($1) OR "pincode" = $1
       LIMIT 1`,
      [parsed.data.query],
    )
    return Response.json({
      available: result.rows.length > 0,
      area: result.rows[0]?.name ?? null,
    })
  } catch (error) {
    console.error('Service area lookup failed', error)
    return Response.json({ error: 'Unable to check service availability right now.' }, { status: 503 })
  }
}
