import { randomUUID } from 'node:crypto'
import { z } from 'zod'
import { pool } from '@/lib/db'
import { isRateLimited, requestKey } from '@/lib/rate-limit'

const contactMessageSchema = z.object({
  name: z.string().trim().min(2).max(200),
  email: z.string().email().max(200).optional().or(z.literal('')),
  phone: z.string().trim().regex(/^[+()\-\s\d]{8,20}$/),
  message: z.string().trim().min(10).max(5000),
  consent: z.literal(true),
  website: z.string().max(0).optional(),
})

export async function POST(request: Request) {
  if (isRateLimited(`contact:${requestKey(request)}`)) {
    return Response.json({ error: 'Too many requests. Please try again later.' }, { status: 429 })
  }
  try {
    const payload = contactMessageSchema.parse(await request.json())
    await pool.query(
      `INSERT INTO "ContactMessage" ("id", "name", "email", "phone", "message", "createdAt")
       VALUES ($1, $2, NULLIF($3, ''), $4, $5, NOW())`,
      [randomUUID(), payload.name, payload.email ?? '', payload.phone, payload.message],
    )
    return Response.json({ success: true, message: 'Thank you! Your message has been sent successfully.' }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: 'Please check the contact details and consent before submitting.' }, { status: 400 })
    }
    console.error('Failed to save contact message', error)
    return Response.json({ error: 'We could not save your message. Please call or WhatsApp the owner.' }, { status: 500 })
  }
}
