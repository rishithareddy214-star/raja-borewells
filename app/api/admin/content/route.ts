import { z } from 'zod'
import { readSiteData, writeSiteData } from '@/lib/site-data'
import { isAdminAuthenticated } from '@/lib/admin-auth'

const businessProfileSchema = z.object({
  businessName: z.string().trim().min(1).max(200),
  ownerName: z.string().trim().min(1).max(200),
  phone: z.string().trim().max(50),
  whatsapp: z.string().trim().max(50),
  email: z.string().trim().max(200),
  address: z.string().trim().max(300),
  city: z.string().trim().max(100),
  state: z.string().trim().max(100),
  businessHours: z.string().trim().max(200),
  experience: z.string().trim().max(100),
  latitude: z.number().min(-90).max(90).nullable(),
  longitude: z.number().min(-180).max(180).nullable(),
  googleMapsUrl: z.string().trim().max(2000),
}).strict()

const contentSchema = z.discriminatedUnion('section', [
  z.object({ section: z.literal('businessProfile'), value: businessProfileSchema }),
  z.object({ section: z.literal('services'), value: z.array(z.object({
    id: z.string().trim().min(1).max(100),
    name: z.string().trim().min(1).max(200),
    description: z.string().trim().max(5000),
  }).strict()).max(200) }),
  z.object({ section: z.literal('serviceRates'), value: z.array(z.object({
    id: z.string().trim().min(1).max(100),
    service: z.string().trim().min(1).max(200),
    unit: z.string().trim().min(1).max(50),
    startingRate: z.string().trim().max(100),
    details: z.string().trim().max(5000),
  }).strict()).max(500) }),
  z.object({ section: z.literal('projects'), value: z.array(z.object({
    id: z.string().trim().min(1).max(100),
    title: z.string().trim().min(1).max(200),
    location: z.string().trim().max(200),
    type: z.string().trim().max(100),
    diameter: z.string().trim().max(100),
    depth: z.string().trim().max(100),
    date: z.string().trim().max(50),
    status: z.string().trim().max(50),
    description: z.string().trim().max(5000),
    image: z.string().trim().max(2000),
  }).strict()).max(500) }),
  z.object({ section: z.literal('serviceAreas'), value: z.array(z.string().trim().min(1).max(200)).max(1000) }),
  z.object({ section: z.literal('faqs'), value: z.array(z.object({
    id: z.string().trim().min(1).max(100),
    question: z.string().trim().min(1).max(300),
    answer: z.string().trim().min(1).max(5000),
  }).strict()).max(500) }),
  z.object({ section: z.literal('reviews'), value: z.array(z.object({
    id: z.string().trim().min(1).max(100),
    customerName: z.string().trim().min(1).max(200),
    area: z.string().trim().max(200),
    rating: z.number().int().min(1).max(5),
    review: z.string().trim().min(1).max(5000),
    date: z.string().trim().max(50),
    approved: z.boolean(),
    permissionToPublish: z.boolean(),
  }).strict()).max(1000) }),
  z.object({ section: z.literal('estimatorRates'), value: z.object({
    ratePerFoot: z.number().positive().nullable(),
    minimumCharge: z.number().nonnegative(),
    equipmentCharge: z.number().nonnegative(),
    transportCharge: z.number().nonnegative(),
    cleaningCharge: z.number().nonnegative(),
    pumpInstallationCharge: z.number().nonnegative(),
  }).strict() }),
])

export async function GET() {
  const isAuthorized = await isAdminAuthenticated()
  if (!isAuthorized) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const data = await readSiteData()
    return Response.json({ success: true, data })
  } catch (error) {
    console.error('Failed to load website content', error)
    return Response.json({ error: 'Unable to load website content.' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  const isAuthorized = await isAdminAuthenticated()
  if (!isAuthorized) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const payload = contentSchema.parse(await request.json())
    const data = await readSiteData()

    if (payload.section === 'businessProfile') {
      data.businessProfile = { ...data.businessProfile, ...payload.value }
    } else if (payload.section === 'services') {
      data.services = payload.value
    } else if (payload.section === 'serviceRates') {
      data.serviceRates = payload.value
    } else if (payload.section === 'projects') {
      data.projects = payload.value
    } else if (payload.section === 'serviceAreas') {
      data.serviceAreas = payload.value
    } else if (payload.section === 'faqs') {
      data.faqs = payload.value
    } else if (payload.section === 'reviews') {
      if (payload.value.some((review) => review.approved && !review.permissionToPublish)) {
        return Response.json({ error: 'Customer permission is required before publishing a review.' }, { status: 400 })
      }
      data.reviews = payload.value
    } else if (payload.section === 'estimatorRates') {
      data.estimatorRates = payload.value
    }

    await writeSiteData(data, payload.section)

    return Response.json({ success: true, message: 'Content updated successfully.' })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: 'Invalid content payload.' }, { status: 400 })
    }
    console.error('Failed to save website content', error)
    return Response.json({ error: 'Unable to save website content.' }, { status: 500 })
  }
}
