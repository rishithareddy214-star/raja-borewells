import fs from 'node:fs'
import path from 'node:path'

export type BusinessProfile = {
  businessName: string
  ownerName: string
  phone: string
  whatsapp: string
  email: string
  address: string
  city: string
  state: string
  businessHours: string
  experience: string
  latitude: number | null
  longitude: number | null
  googleMapsUrl: string
}

export type ServiceItem = {
  id: string
  name: string
  description: string
}

export type RateItem = {
  id: string
  service: string
  unit: string
  startingRate: string
  details: string
}

export type ProjectItem = {
  id: string
  title: string
  location: string
  type: string
  diameter: string
  depth: string
  date: string
  status: string
  description: string
  image: string
}

export type FaqItem = {
  id: string
  question: string
  answer: string
}

export type ReviewItem = {
  id: string
  customerName: string
  area: string
  rating: number
  review: string
  date: string
  approved: boolean
  permissionToPublish: boolean
}

export type SiteData = {
  businessProfile: BusinessProfile
  estimatorRates: {
    ratePerFoot: number | null
    minimumCharge: number
    equipmentCharge: number
    transportCharge: number
    cleaningCharge: number
    pumpInstallationCharge: number
  }
  services: ServiceItem[]
  serviceRates: RateItem[]
  projects: ProjectItem[]
  serviceAreas: string[]
  faqs: FaqItem[]
  reviews: ReviewItem[]
}

export const defaultBusinessProfile: BusinessProfile = {
  businessName: 'Raja Borewells',
  ownerName: 'Banda Malla Reddy',
  phone: '+91XXXXXXXXXX',
  whatsapp: '+91XXXXXXXXXX',
  email: '',
  address: 'Hyderabad, Telangana',
  city: 'Hyderabad',
  state: 'Telangana',
  businessHours: '',
  experience: '',
  latitude: null,
  longitude: null,
  googleMapsUrl: '',
}

export const defaultServices: ServiceItem[] = [
  { id: 'new-borewell-drilling', name: 'New Borewell Drilling', description: 'Professional drilling for new water points on residential, agricultural and commercial plots.' },
  { id: 'residential-borewell', name: 'Residential Borewell Drilling', description: 'Borewell drilling solutions designed for homes, apartments and compact urban plots.' },
  { id: 'agricultural-borewell', name: 'Agricultural Borewell Drilling', description: 'Site-based drilling for farms, fields and irrigation requirements.' },
  { id: 'commercial-borewell', name: 'Commercial Borewell Drilling', description: 'Reliable water access planning for offices, warehouses and commercial developments.' },
  { id: 'deep-borewell', name: 'Deep Borewell Drilling', description: 'Deep drilling for sites with varying geology and water requirement needs.' },
  { id: 'borewell-cleaning', name: 'Borewell Cleaning', description: 'Cleaning and redevelopment support for older or silted borewells.' },
  { id: 'borewell-repair', name: 'Borewell Repair', description: 'Repair assistance for damaged casing, pump issues and system performance concerns.' },
  { id: 'submersible-pump-installation', name: 'Submersible Pump Installation', description: 'Pump fitting and installation for dependable water lifting and usage.' },
  { id: 'borewell-camera-inspection', name: 'Borewell Camera Inspection', description: 'Inspection support to assess borewell condition and identify the right course of action.' },
  { id: 'site-inspection', name: 'Site Inspection / Water Point Consultation', description: 'On-site consultation to understand location, soil conditions and the best drilling approach.' },
]

export const defaultServiceRates: RateItem[] = [
  { id: '5-inch', service: '5 Inch Borewell Drilling', unit: 'Per Feet', startingRate: 'Contact for Rate', details: 'Depends on location, soil and rock conditions.' },
  { id: '6.5-inch', service: '6.5 Inch Borewell Drilling', unit: 'Per Feet', startingRate: 'Contact for Rate', details: 'Depends on location, soil and rock conditions.' },
  { id: 'borewell-cleaning-rate', service: 'Borewell Cleaning', unit: 'Per Service', startingRate: 'Contact for Rate', details: 'Depends on borewell condition and cleaning requirements.' },
  { id: 'pump-installation-rate', service: 'Pump Installation', unit: 'Per Installation', startingRate: 'Contact for Rate', details: 'Pump specification and site conditions determine the final quotation.' },
]

export const defaultProjects: ProjectItem[] = [
  // Projects are added by the business after customer permission is confirmed.
]

export const defaultServiceAreas: string[] = []

export const defaultFaqs: FaqItem[] = [
  { id: 'faq-cost', question: 'How much does borewell drilling cost?', answer: 'The actual borewell cost depends on location, drilling depth, soil and rock conditions, bore diameter, machinery requirements and other site conditions. Contact us for an accurate quotation.' },
  { id: 'faq-depth', question: 'How deep can you drill?', answer: 'The required drilling depth is determined by site conditions, geology and water requirements. Actual drill depth depends on the ground profile at the location.' },
  { id: 'faq-depth-decided', question: 'How is the borewell depth decided?', answer: 'Depth is decided based on the site assessment, geology, local water conditions discussed during the inspection and project requirements.' },
  { id: 'faq-agri', question: 'Do you provide agricultural borewell drilling?', answer: 'Yes, agricultural borewell drilling services can be discussed based on the land, water needs and site conditions.' },
  { id: 'faq-residential', question: 'Do you provide residential borewell drilling?', answer: 'Yes, residential borewell drilling support is available for homes and residential plots.' },
  { id: 'faq-cleaning', question: 'Do you provide borewell cleaning?', answer: 'Yes, borewell cleaning can be arranged based on the borewell condition and the work required.' },
  { id: 'faq-pump', question: 'Do you install submersible pumps?', answer: 'Yes, submersible pump installation can be provided based on the project requirements and specification.' },
  { id: 'faq-rate', question: 'How can I get a quotation?', answer: 'You can call the owner, send a WhatsApp message or submit the quote request form on the website.' },
  { id: 'faq-areas', question: 'Which areas of Hyderabad do you serve?', answer: 'Service areas may vary by project and location. Contact us to confirm service availability for your area.' },
  { id: 'faq-owner', question: 'Can I contact the owner directly?', answer: 'Yes, the owner can be contacted directly through the call or WhatsApp options available across the website.' },
]

export const defaultReviews: ReviewItem[] = []

export const defaultSiteData: SiteData = {
  businessProfile: defaultBusinessProfile,
  estimatorRates: {
    ratePerFoot: null,
    minimumCharge: 0,
    equipmentCharge: 0,
    transportCharge: 0,
    cleaningCharge: 0,
    pumpInstallationCharge: 0,
  },
  services: defaultServices,
  serviceRates: defaultServiceRates,
  projects: defaultProjects,
  serviceAreas: defaultServiceAreas,
  faqs: defaultFaqs,
  reviews: defaultReviews,
}

export function getSiteDataPath() {
  return path.join(process.cwd(), 'data', 'site-content.json')
}

export async function readSiteData(): Promise<SiteData> {
  if (process.env.DATABASE_URL) {
    const { readSiteDataFromDatabase } = await import('@/lib/site-content-db')
    return readSiteDataFromDatabase()
  }

  const filePath = getSiteDataPath()

  try {
    if (!fs.existsSync(filePath)) {
      await writeSiteData(defaultSiteData)
      return defaultSiteData
    }

    const raw = fs.readFileSync(filePath, 'utf8')
    const parsed = JSON.parse(raw) as SiteData
    return {
      ...defaultSiteData,
      ...parsed,
      businessProfile: { ...defaultBusinessProfile, ...parsed.businessProfile },
      estimatorRates: { ...defaultSiteData.estimatorRates, ...parsed.estimatorRates },
      services: parsed.services?.length ? parsed.services : defaultServices,
      serviceRates: parsed.serviceRates?.length ? parsed.serviceRates : defaultServiceRates,
      projects: parsed.projects?.length ? parsed.projects : defaultProjects,
      serviceAreas: parsed.serviceAreas?.length ? parsed.serviceAreas : defaultServiceAreas,
      faqs: parsed.faqs?.length ? parsed.faqs : defaultFaqs,
      reviews: parsed.reviews?.map((review) => ({
        ...review,
        approved: review.approved ?? false,
        permissionToPublish: review.permissionToPublish ?? false,
      })) ?? defaultReviews,
    }
  } catch (error) {
    console.error('Unable to read saved website content', error)
    throw error
  }
}

export async function readPublicSiteData(): Promise<SiteData> {
  const data = await readSiteData()
  return {
    ...data,
    reviews: data.reviews.filter((review) => review.approved && review.permissionToPublish),
  }
}

export async function writeSiteData(data: Partial<SiteData>, section?: keyof SiteData) {
  const filePath = getSiteDataPath()
  const dir = path.dirname(filePath)

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }

  const merged = {
    ...defaultSiteData,
    ...data,
    businessProfile: {
      ...defaultBusinessProfile,
      ...(data.businessProfile ?? {}),
    },
    estimatorRates: {
      ...defaultSiteData.estimatorRates,
      ...(data.estimatorRates ?? {}),
    },
    services: data.services ?? defaultServices,
    serviceRates: data.serviceRates ?? defaultServiceRates,
    projects: data.projects ?? defaultProjects,
    serviceAreas: data.serviceAreas ?? defaultServiceAreas,
    faqs: data.faqs ?? defaultFaqs,
    reviews: data.reviews ?? defaultReviews,
  }

  if (process.env.DATABASE_URL) {
    if (!section) {
      throw new Error('A content section is required when saving website content to the database.')
    }
    const { writeSiteDataToDatabase } = await import('@/lib/site-content-db')
    await writeSiteDataToDatabase(merged, section)
  }

  if (process.env.NODE_ENV !== 'production' || !process.env.DATABASE_URL) {
    fs.writeFileSync(filePath, JSON.stringify(merged, null, 2), 'utf8')
  }
  return merged
}
