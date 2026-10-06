import { randomUUID } from 'node:crypto'
import { z } from 'zod'
import { pool } from '@/lib/db'
import { isRateLimited, requestKey } from '@/lib/rate-limit'

const eventSchema = z.object({
  contactType: z.enum(['call', 'whatsapp', 'quote', 'site-visit']),
  sourcePage: z.string().max(300).default('/'),
  serviceId: z.string().max(100).optional(),
  area: z.string().max(200).optional(),
  deviceType: z.enum(['mobile', 'tablet', 'desktop', 'unknown']).default('unknown'),
})

export async function POST(request: Request) {
  if (isRateLimited(`track:${requestKey(request)}`, 60)) {
    return Response.json({ error: 'Too many tracking events.' }, { status: 429 })
  }
  try {
    const event = eventSchema.parse(await request.json())
    await pool.query(
      `INSERT INTO "ContactEvent" ("id", "contactType", "sourcePage", "serviceId", "area", "deviceType", "createdAt")
       VALUES ($1, $2, $3, $4, NULLIF($5, ''), $6, NOW())`,
      [randomUUID(), event.contactType, event.sourcePage, event.serviceId ?? null, event.area ?? '', event.deviceType],
    )
    return Response.json({ success: true }, { status: 202 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: 'Invalid contact event.' }, { status: 400 })
    }
    console.error('Failed to track contact event', error)
    return Response.json({ error: 'Unable to track contact event.' }, { status: 500 })
  }
}
