import { randomUUID } from 'node:crypto'
import { z } from 'zod'
import { pool } from '@/lib/db'
import { isRateLimited, requestKey } from '@/lib/rate-limit'

const siteVisitSchema = z.object({
  name: z.string().trim().min(2).max(200),
  phone: z.string().trim().regex(/^[+()\-\s\d]{8,20}$/),
  location: z.string().trim().min(2).max(200),
  googleMaps: z.string().url().max(1000).optional().or(z.literal('')),
  landType: z.string().trim().max(100).optional().or(z.literal('')),
  preferredDate: z.string().trim().max(50).optional().or(z.literal('')),
  preferredTime: z.string().trim().max(50).optional().or(z.literal('')),
  message: z.string().trim().max(5000).optional().or(z.literal('')),
  consent: z.literal(true),
  website: z.string().max(0).optional(),
})

export async function POST(request: Request) {
  if (isRateLimited(`site-visit:${requestKey(request)}`)) {
    return Response.json({ error: 'Too many requests. Please try again later.' }, { status: 429 })
  }
  try {
    const payload = siteVisitSchema.parse(await request.json())
    await pool.query(
      `INSERT INTO "SiteVisit" ("id", "name", "phone", "location", "googleMaps", "landType", "preferredDate", "preferredTime", "message", "status", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, NULLIF($5, ''), NULLIF($6, ''), NULLIF($7, ''), NULLIF($8, ''), NULLIF($9, ''), 'New', NOW(), NOW())`,
      [randomUUID(), payload.name, payload.phone, payload.location, payload.googleMaps ?? '', payload.landType ?? '', payload.preferredDate ?? '', payload.preferredTime ?? '', payload.message ?? ''],
    )
    return Response.json({ success: true, message: 'Thanks! Your site visit request has been received.' }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: 'Please check the site visit details and try again.' }, { status: 400 })
    }
    console.error('Failed to save site visit request', error)
    return Response.json({ error: 'We could not save your request. Please call or WhatsApp the owner.' }, { status: 500 })
  }
}
