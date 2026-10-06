import { randomUUID } from 'node:crypto'
import { z } from 'zod'
import { pool } from '@/lib/db'
import { isRateLimited, requestKey } from '@/lib/rate-limit'

const reviewSchema = z.object({
  customerName: z.string().trim().min(2).max(200),
  area: z.string().trim().max(200),
  rating: z.number().int().min(1).max(5),
  review: z.string().trim().min(10).max(3000),
  permissionToPublish: z.literal(true),
  website: z.string().max(0).optional(),
})

export async function POST(request: Request) {
  if (isRateLimited(`review:${requestKey(request)}`, 3)) {
    return Response.json({ error: 'Too many requests. Please try again later.' }, { status: 429 })
  }
  try {
    const data = reviewSchema.parse(await request.json())
    const now = new Date()
    await pool.query(
      `INSERT INTO "Review" ("id", "customerName", "area", "rating", "review", "date", "approved", "permissionToPublish", "createdAt", "updatedAt")
       VALUES ($1,$2,$3,$4,$5,$6,FALSE,TRUE,NOW(),NOW())`,
      [randomUUID(), data.customerName, data.area, data.rating, data.review, now.toISOString().slice(0, 10)],
    )
    return Response.json({ success: true, message: 'Thank you. Your review was received and will be checked before publishing.' }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: 'Please complete all review fields and grant permission before submitting.' }, { status: 400 })
    }
    console.error('Failed to save customer review', error)
    return Response.json({ error: 'Unable to submit your review right now.' }, { status: 500 })
  }
}
