import { z } from 'zod'
import { isAdminAuthenticated } from '@/lib/admin-auth'
import { pool } from '@/lib/db'

const updateSchema = z.object({
  id: z.string().min(1),
  status: z.enum(['New', 'Contacted', 'Scheduled', 'Completed', 'Cancelled']),
})

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const result = await pool.query(`SELECT * FROM "SiteVisit" ORDER BY "createdAt" DESC LIMIT 300`)
    return Response.json({ siteVisits: result.rows })
  } catch (error) {
    console.error('Failed to load site visit requests', error)
    return Response.json({ error: 'Site visit requests are temporarily unavailable.' }, { status: 503 })
  }
}

export async function PATCH(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const { id, status } = updateSchema.parse(await request.json())
    const result = await pool.query(
      `UPDATE "SiteVisit" SET "status" = $2, "updatedAt" = NOW() WHERE "id" = $1`,
      [id, status],
    )
    if (result.rowCount === 0) {
      return Response.json({ error: 'Site visit request not found.' }, { status: 404 })
    }
    return Response.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: 'Invalid site visit status update.' }, { status: 400 })
    }
    console.error('Failed to update site visit request', error)
    return Response.json({ error: 'Unable to update site visit request.' }, { status: 500 })
  }
}
