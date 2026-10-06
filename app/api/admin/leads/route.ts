import { randomUUID } from 'node:crypto'
import { z } from 'zod'
import { isAdminAuthenticated } from '@/lib/admin-auth'
import { pool } from '@/lib/db'

const updateSchema = z.object({
  id: z.string().min(1),
  status: z.enum(['NEW', 'CONTACTED', 'QUOTE SENT', 'SITE VISIT REQUESTED', 'SITE VISIT COMPLETED', 'WORK SCHEDULED', 'WORK IN PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
  followUpAt: z.string().datetime().nullable().optional(),
  followUpDone: z.boolean().optional(),
  note: z.string().trim().min(1).max(3000).optional(),
})

export async function GET(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const search = searchParams.get('search')?.trim() ?? ''
  const status = searchParams.get('status')?.trim() ?? ''
  const service = searchParams.get('service')?.trim() ?? ''
  const area = searchParams.get('area')?.trim() ?? ''
  const source = searchParams.get('source')?.trim() ?? ''
  const dateFrom = searchParams.get('dateFrom')?.trim() ?? ''
  const dateTo = searchParams.get('dateTo')?.trim() ?? ''
  const validDate = (value: string) => !value || (/^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`)))
  if (!validDate(dateFrom) || !validDate(dateTo)) {
    return Response.json({ error: 'Invalid date filter.' }, { status: 400 })
  }
  const values: string[] = []
  const filters: string[] = []

  if (search) {
    values.push(`%${search}%`)
    filters.push(`("leadId" ILIKE $${values.length} OR "customerName" ILIKE $${values.length} OR "phone" ILIKE $${values.length} OR COALESCE("area", '') ILIKE $${values.length})`)
  }
  if (status) {
    values.push(status)
    filters.push(`"status" = $${values.length}`)
  }
  if (service) {
    values.push(`%${service}%`)
    filters.push(`COALESCE("serviceLabel", "borewellType", '') ILIKE $${values.length}`)
  }
  if (area) {
    values.push(`%${area}%`)
    filters.push(`COALESCE("area", '') ILIKE $${values.length}`)
  }
  if (source) {
    values.push(source)
    filters.push(`COALESCE("leadSource", '') = $${values.length}`)
  }
  if (dateFrom) {
    values.push(dateFrom)
    filters.push(`e."createdAt" >= $${values.length}::date`)
  }
  if (dateTo) {
    values.push(dateTo)
    filters.push(`e."createdAt" < ($${values.length}::date + INTERVAL '1 day')`)
  }

  try {
    const result = await pool.query(
      `SELECT e."id", e."leadId", e."customerName", e."phone", e."whatsapp", e."area", e."village", e."city",
        e."serviceLabel", e."borewellType", e."purpose", e."approxDepth", e."boreDiameter", e."status", e."leadSource", e."sourcePage",
        e."contactType", e."deviceType", e."possibleDuplicate", e."followUpAt", e."followUpDone", e."createdAt",
        COALESCE(json_agg(json_build_object('id', n."id", 'note', n."note", 'createdAt', n."createdAt"))
          FILTER (WHERE n."id" IS NOT NULL), '[]'::json) AS "notes"
       FROM "Enquiry" e LEFT JOIN "CustomerNote" n ON n."enquiryId" = e."id"
       ${filters.length ? `WHERE ${filters.join(' AND ')}` : ''}
       GROUP BY e."id" ORDER BY e."createdAt" DESC LIMIT 500`,
      values,
    )
    const summary = await pool.query(
      `SELECT COUNT(*)::int AS "totalEnquiries",
        COUNT(*) FILTER (WHERE "status" = 'NEW')::int AS "newEnquiries",
        COUNT(*) FILTER (WHERE "status" = 'COMPLETED')::int AS "completedJobs",
        COUNT(*) FILTER (WHERE "contactType" = 'quote')::int AS "quoteRequests",
        COUNT(*) FILTER (WHERE "followUpAt"::date <= CURRENT_DATE AND NOT "followUpDone")::int AS "pendingFollowUps"
       FROM "Enquiry"`,
    )
    const siteVisitCount = await pool.query(`SELECT COUNT(*)::int AS count FROM "SiteVisit"`)
    const events = await pool.query(
      `SELECT "contactType", COUNT(*)::int AS count FROM "ContactEvent"
       WHERE "createdAt" >= CURRENT_DATE GROUP BY "contactType"`,
    )
    const sources = await pool.query(
      `SELECT COALESCE("leadSource", 'Direct') AS source, COUNT(*)::int AS count
       FROM "Enquiry" GROUP BY COALESCE("leadSource", 'Direct') ORDER BY count DESC`,
    )
    const services = await pool.query(
      `SELECT COALESCE("serviceLabel", "borewellType", 'Unspecified') AS service, COUNT(*)::int AS count
       FROM "Enquiry" GROUP BY COALESCE("serviceLabel", "borewellType", 'Unspecified') ORDER BY count DESC LIMIT 10`,
    )
    const areas = await pool.query(
      `SELECT COALESCE("area", 'Unspecified') AS area, COUNT(*)::int AS count
       FROM "Enquiry" GROUP BY COALESCE("area", 'Unspecified') ORDER BY count DESC LIMIT 10`,
    )
    const leadsByDay = await pool.query(
      `SELECT date_trunc('day', "createdAt")::date::text AS day, COUNT(*)::int AS count
       FROM "Enquiry" WHERE "createdAt" >= CURRENT_DATE - INTERVAL '29 days'
       GROUP BY date_trunc('day', "createdAt")::date ORDER BY day`,
    )
    const callbacks = await pool.query(
      `SELECT "id", "name", "phone", "preferredTime", "message", "status", "createdAt"
       FROM "CallbackRequest" ORDER BY "createdAt" DESC LIMIT 100`,
    )
    const contactEvents = events.rows.reduce<Record<string, number>>((acc, row) => {
      acc[row.contactType] = row.count
      return acc
    }, {})

    return Response.json({
      leads: result.rows,
      summary: { ...summary.rows[0], siteVisits: siteVisitCount.rows[0].count, callClicks: contactEvents.call ?? 0, whatsappClicks: contactEvents.whatsapp ?? 0 },
      sources: sources.rows,
      services: services.rows,
      areas: areas.rows,
      leadsByDay: leadsByDay.rows,
      callbacks: callbacks.rows,
    })
  } catch (error) {
    console.error('Failed to load lead dashboard data', error)
    return Response.json({ error: 'Lead data is temporarily unavailable.' }, { status: 503 })
  }
}

export async function PATCH(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const payload = updateSchema.parse(await request.json())
    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      if (payload.status !== undefined || payload.followUpAt !== undefined || payload.followUpDone !== undefined) {
        const updated = await client.query(
          `UPDATE "Enquiry" SET
            "status" = COALESCE($2, "status"),
            "followUpAt" = CASE WHEN $3::boolean THEN $4::timestamp ELSE "followUpAt" END,
            "followUpDone" = COALESCE($5, "followUpDone"),
            "updatedAt" = NOW()
           WHERE "id" = $1`,
          [payload.id, payload.status ?? null, payload.followUpAt !== undefined, payload.followUpAt ?? null, payload.followUpDone ?? null],
        )
        if (updated.rowCount === 0) {
          await client.query('ROLLBACK')
          return Response.json({ error: 'Enquiry not found.' }, { status: 404 })
        }
      }
      if (payload.note) {
        await client.query(
          `INSERT INTO "CustomerNote" ("id", "enquiryId", "note", "createdAt") VALUES ($1, $2, $3, NOW())`,
          [randomUUID(), payload.id, payload.note],
        )
      }
      await client.query(
        `INSERT INTO "AdminActivityLog" ("id", "adminEmail", "action", "recordType", "recordId", "createdAt")
         VALUES ($1, $2, $3, 'Enquiry', $4, NOW())`,
        [randomUUID(), process.env.ADMIN_EMAIL ?? 'admin', payload.note ? 'Added lead note' : 'Updated lead', payload.id],
      )
      await client.query('COMMIT')
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
    return Response.json({ success: true, message: 'Lead updated.' })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: 'Invalid lead update.' }, { status: 400 })
    }
    console.error('Failed to update lead', error)
    return Response.json({ error: 'Unable to update this lead.' }, { status: 500 })
  }
}
