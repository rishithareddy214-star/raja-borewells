import { randomUUID } from 'node:crypto'
import type { PoolClient } from 'pg'
import { z } from 'zod'
import { pool } from '@/lib/db'
import { isRateLimited, requestKey } from '@/lib/rate-limit'

const enquirySchema = z.object({
  customerName: z.string().trim().min(2).max(200),
  phone: z.string().trim().regex(/^[+()\-\s\d]{8,20}$/),
  whatsapp: z.string().trim().max(50).optional().or(z.literal('')),
  area: z.string().trim().max(200).optional().or(z.literal('')),
  village: z.string().trim().max(200).optional().or(z.literal('')),
  city: z.string().trim().max(100).optional().or(z.literal('')),
  pincode: z.string().trim().max(20).optional().or(z.literal('')),
  googleMaps: z.string().url().max(1000).optional().or(z.literal('')),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  landType: z.string().trim().max(100).optional().or(z.literal('')),
  borewellType: z.string().trim().max(100).optional().or(z.literal('')),
  service: z.string().trim().max(200).optional().or(z.literal('')),
  approxDepth: z.string().trim().max(100).optional().or(z.literal('')),
  landSize: z.string().trim().max(100).optional().or(z.literal('')),
  preferredDate: z.string().trim().max(50).optional().or(z.literal('')),
  message: z.string().trim().max(5000).optional().or(z.literal('')),
  purpose: z.string().trim().max(100).optional().or(z.literal('')),
  boreDiameter: z.string().trim().max(100).optional().or(z.literal('')),
  contactType: z.enum(['quote', 'whatsapp', 'call', 'site-visit']).default('quote'),
  sourcePage: z.string().trim().max(300).default('/'),
  leadSource: z.enum(['Google Search', 'Google Maps', 'WhatsApp', 'Instagram', 'Facebook', 'Direct', 'Referral', 'Other']).default('Direct'),
  deviceType: z.enum(['mobile', 'tablet', 'desktop', 'unknown']).default('unknown'),
  consent: z.literal(true),
  website: z.string().max(0).optional(),
})

export async function POST(request: Request) {
  if (isRateLimited(`enquiry:${requestKey(request)}`, 5)) {
    return Response.json({ error: 'Too many requests. Please try again in a few minutes.' }, { status: 429 })
  }

  let client: PoolClient | undefined
  let transactionStarted = false

  try {
    const payload = enquirySchema.parse(await request.json())
    client = await pool.connect()
    await client.query('BEGIN')
    transactionStarted = true
    await client.query(
      `SELECT pg_advisory_xact_lock(hashtextextended(regexp_replace($1::text, '\\D', '', 'g'), 0))`,
      [payload.phone],
    )
    const duplicate = await client.query(
      `SELECT 1 FROM "Enquiry" WHERE regexp_replace("phone", '\\D', '', 'g') = regexp_replace($1, '\\D', '', 'g')
       AND "createdAt" > NOW() - INTERVAL '10 minutes' LIMIT 1`,
      [payload.phone],
    )
    const id = randomUUID()
    const result = await client.query<{ id: string; "leadId": string; "createdAt": Date }>(
      `INSERT INTO "Enquiry" (
        "id", "leadId", "customerName", "phone", "whatsapp", "area", "city", "landType",
        "serviceLabel", "borewellType", "approxDepth", "preferredDate", "message", "purpose",
        "boreDiameter", "village", "pincode", "googleMaps", "latitude", "longitude", "landSize", "contactType",
        "sourcePage", "leadSource", "deviceType", "possibleDuplicate", "status", "createdAt", "updatedAt"
      ) VALUES (
        $1,
        'RB-' || to_char(CURRENT_DATE, 'YYYY') || '-' || lpad(nextval('"Enquiry_lead_id_seq"')::text, 4, '0'),
        $2, $3, NULLIF($4, ''), NULLIF($5, ''), NULLIF($6, ''), NULLIF($7, ''),
        NULLIF($8, ''), NULLIF($9, ''), NULLIF($10, ''), NULLIF($11, ''), NULLIF($12, ''),
        NULLIF($13, ''), NULLIF($14, ''), NULLIF($15, ''), NULLIF($16, ''), NULLIF($17, ''),
        $18, $19, NULLIF($20, ''), $21, $22, $23, $24, $25, 'NEW', NOW(), NOW()
      ) RETURNING "id", "leadId", "createdAt"`,
      [
        id, payload.customerName, payload.phone, payload.whatsapp ?? '', payload.area ?? '',
        payload.city ?? '', payload.landType ?? '', payload.service ?? '', payload.borewellType ?? '',
        payload.approxDepth ?? '', payload.preferredDate ?? '', payload.message ?? '',
        payload.purpose ?? '', payload.boreDiameter ?? '', payload.village ?? '', payload.pincode ?? '', payload.googleMaps ?? '',
        payload.latitude ?? null, payload.longitude ?? null, payload.landSize ?? '',
        payload.contactType, payload.sourcePage, payload.leadSource, payload.deviceType,
        duplicate.rows.length > 0,
      ],
    )
    await client.query('COMMIT')
    transactionStarted = false

    return Response.json({
      success: true,
      leadId: result.rows[0].leadId,
      possibleDuplicate: duplicate.rows.length > 0,
      message: `Thank you for contacting Raja Borewells. Your enquiry ID is ${result.rows[0].leadId}.`,
    }, { status: 201 })
  } catch (error) {
    if (client && transactionStarted) {
      try {
        await client.query('ROLLBACK')
      } catch (rollbackError) {
        console.error('Failed to roll back enquiry transaction', rollbackError)
      }
    }
    if (error instanceof z.ZodError) {
      return Response.json({ error: 'Please check the form fields and consent before submitting.' }, { status: 400 })
    }
    console.error('Failed to save enquiry', error)
    return Response.json({ error: 'We could not save your enquiry just now. Please call or WhatsApp the owner.' }, { status: 500 })
  } finally {
    client?.release()
  }
}
