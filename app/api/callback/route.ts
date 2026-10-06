import { randomUUID } from 'node:crypto'
import { z } from 'zod'
import { pool } from '@/lib/db'
import { isRateLimited, requestKey } from '@/lib/rate-limit'

const callbackSchema = z.object({
  name: z.string().trim().min(2).max(200),
  phone: z.string().trim().regex(/^[+()\-\s\d]{8,20}$/),
  preferredTime: z.enum(['Morning', 'Afternoon', 'Evening', 'Anytime']),
  message: z.string().trim().max(2000).optional().or(z.literal('')),
  consent: z.literal(true),
  website: z.string().max(0).optional(),
})

export async function POST(request: Request) {
  if (isRateLimited(`callback:${requestKey(request)}`)) {
    return Response.json({ error: 'Too many requests. Please try again later.' }, { status: 429 })
  }
  try {
    const data = callbackSchema.parse(await request.json())
    await pool.query(
      `INSERT INTO "CallbackRequest" ("id", "name", "phone", "preferredTime", "message", "status", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, NULLIF($5, ''), 'New', NOW(), NOW())`,
      [randomUUID(), data.name, data.phone, data.preferredTime, data.message ?? ''],
    )
    return Response.json({ success: true, message: 'Callback request received. Raja Borewells will contact you.' }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: 'Please check the callback details and consent.' }, { status: 400 })
    }
    console.error('Failed to save callback request', error)
    return Response.json({ error: 'We could not save your callback request. Please call the owner.' }, { status: 500 })
  }
}
