import { z } from 'zod'
import { isAdminAuthenticated } from '@/lib/admin-auth'
import { pool } from '@/lib/db'

const callbackStatusSchema = z.object({
  id: z.string().min(1),
  status: z.enum(['New', 'Contacted', 'Completed']),
})

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const result = await pool.query(`SELECT * FROM "CallbackRequest" ORDER BY "createdAt" DESC LIMIT 300`)
    return Response.json({ callbacks: result.rows })
  } catch (error) {
    console.error('Failed to load callback requests', error)
    return Response.json({ error: 'Callback requests are unavailable.' }, { status: 503 })
  }
}

export async function PATCH(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const { id, status } = callbackStatusSchema.parse(await request.json())
    const result = await pool.query(
      `UPDATE "CallbackRequest" SET "status" = $2, "updatedAt" = NOW() WHERE "id" = $1`,
      [id, status],
    )
    if (result.rowCount === 0) {
      return Response.json({ error: 'Callback request not found.' }, { status: 404 })
    }
    return Response.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: 'Invalid callback status update.' }, { status: 400 })
    }
    console.error('Failed to update callback request', error)
    return Response.json({ error: 'Unable to update callback request.' }, { status: 500 })
  }
}
