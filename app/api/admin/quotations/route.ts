import { randomBytes, randomUUID } from 'node:crypto'
import { z } from 'zod'
import { isAdminAuthenticated } from '@/lib/admin-auth'
import { pool } from '@/lib/db'

const quotationSchema = z.object({
  enquiryId: z.string().min(1),
  description: z.string().trim().min(3).max(5000),
  quantity: z.coerce.number().positive().max(1_000_000),
  unit: z.string().trim().min(1).max(50),
  rate: z.coerce.number().min(0).max(1_000_000_000),
  additionalCharges: z.coerce.number().min(0).default(0),
  discount: z.coerce.number().min(0).default(0),
  tax: z.coerce.number().min(0).default(0),
  validity: z.string().max(100).optional(),
  terms: z.string().max(5000).optional(),
  notes: z.string().max(3000).optional(),
})

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const result = await pool.query(
      `SELECT q."id", q."quotationId", q."secureToken", q."enquiryId", q."description", q."quantity",
        q."unit", q."rate", q."additionalCharges", q."discount", q."tax", q."grandTotal",
        q."validity", q."terms", q."notes", q."createdAt", e."leadId", e."customerName", e."phone", e."whatsapp"
       FROM "Quotation" q JOIN "Enquiry" e ON e."id" = q."enquiryId"
       ORDER BY q."createdAt" DESC LIMIT 300`,
    )
    return Response.json({ quotations: result.rows })
  } catch (error) {
    console.error('Failed to load quotations', error)
    return Response.json({ error: 'Quotations are temporarily unavailable.' }, { status: 503 })
  }
}

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const data = quotationSchema.parse(await request.json())
    const subtotal = data.quantity * data.rate
    const grandTotal = Math.max(0, subtotal + data.additionalCharges - data.discount + data.tax)
    const client = await pool.connect()
    let quotation: { quotationId: string; secureToken: string }
    try {
      await client.query('BEGIN')
      const result = await client.query<{ quotationId: string; secureToken: string }>(
        `INSERT INTO "Quotation" (
        "id", "quotationId", "secureToken", "enquiryId", "description", "quantity", "unit", "rate",
        "additionalCharges", "discount", "tax", "grandTotal", "validity", "terms", "notes", "createdAt", "updatedAt"
      ) VALUES (
        $1,
        'QT-' || to_char(CURRENT_DATE, 'YYYY') || '-' || lpad(nextval('"Quotation_quotation_id_seq"')::text, 4, '0'),
        $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NULLIF($12, ''), NULLIF($13, ''), NULLIF($14, ''), NOW(), NOW()
        ) RETURNING "quotationId", "secureToken"`,
        [
          randomUUID(),
          randomBytes(32).toString('base64url'),
          data.enquiryId,
          data.description,
          data.quantity,
          data.unit,
          data.rate,
          data.additionalCharges,
          data.discount,
          data.tax,
          grandTotal,
          data.validity ?? '',
          data.terms ?? '',
          data.notes ?? '',
        ],
      )
      quotation = result.rows[0]
      await client.query(`UPDATE "Enquiry" SET "status" = 'QUOTE SENT', "updatedAt" = NOW() WHERE "id" = $1`, [data.enquiryId])
      await client.query(
        `INSERT INTO "AdminActivityLog" ("id", "adminEmail", "action", "recordType", "recordId", "createdAt")
       VALUES ($1, $2, 'Created quotation', 'Quotation', $3, NOW())`,
        [randomUUID(), process.env.ADMIN_EMAIL ?? 'admin', quotation.quotationId],
      )
      await client.query('COMMIT')
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
    return Response.json({
      success: true,
      quotationId: quotation.quotationId,
      secureUrl: `/quote/${quotation.secureToken}`,
      message: `Quotation ${quotation.quotationId} created.`,
    }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: 'Please provide valid quotation values.' }, { status: 400 })
    }
    console.error('Failed to create quotation', error)
    return Response.json({ error: 'Unable to create quotation.' }, { status: 500 })
  }
}
