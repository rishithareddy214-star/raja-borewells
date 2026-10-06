import { randomUUID } from 'node:crypto'
import { pool } from '@/lib/db'
import {
  defaultBusinessProfile,
  defaultFaqs,
  defaultProjects,
  defaultReviews,
  defaultServiceAreas,
  defaultServiceRates,
  defaultServices,
  defaultSiteData,
  type SiteData,
} from '@/lib/site-data'

export async function readSiteDataFromDatabase(): Promise<SiteData> {
  const client = await pool.connect()
  try {
    const [
      profileResult,
      serviceResult,
      rateResult,
      projectResult,
      areaResult,
      faqResult,
      reviewResult,
      settingResult,
    ] = [
      await client.query(`SELECT * FROM "BusinessProfile" ORDER BY "createdAt" ASC LIMIT 1`),
      await client.query(`SELECT * FROM "Service" ORDER BY "createdAt" ASC`),
      await client.query(`SELECT "id", "serviceLabel", "unit", "startingRate", "details" FROM "ServiceRate" ORDER BY "createdAt" ASC`),
      await client.query(`SELECT "id", "title", "location", "type", "diameter", "depth", "date", "status", "description", "image" FROM "Project" ORDER BY "createdAt" DESC`),
      await client.query(`SELECT "name" FROM "ServiceArea" ORDER BY "name" ASC`),
      await client.query(`SELECT "id", "question", "answer" FROM "Faq" ORDER BY "createdAt" ASC`),
      await client.query(`SELECT "id", "customerName", "area", "rating", "review", "date", "approved", "permissionToPublish" FROM "Review" ORDER BY "createdAt" DESC`),
      await client.query(`SELECT "value" FROM "AdminSetting" WHERE "key" = 'siteContentInitialized' LIMIT 1`),
    ]

    const initialized = settingResult.rows[0]?.value === '1'
    const profile = profileResult.rows[0]
    const estimatorResult = await client.query(`SELECT "value" FROM "AdminSetting" WHERE "key" = 'borewellEstimatorRates' LIMIT 1`)
    const estimatorRates = estimatorResult.rows[0]?.value
      ? { ...defaultSiteData.estimatorRates, ...JSON.parse(estimatorResult.rows[0].value) }
      : defaultSiteData.estimatorRates

    return {
      ...defaultSiteData,
      businessProfile: profile ? {
        businessName: profile.businessName,
        ownerName: profile.ownerName,
        phone: profile.phone,
        whatsapp: profile.whatsapp,
        email: profile.email,
        address: profile.address,
        city: profile.city,
        state: profile.state,
        businessHours: profile.businessHours,
        experience: profile.experience,
        latitude: profile.latitude === null ? null : Number(profile.latitude),
        longitude: profile.longitude === null ? null : Number(profile.longitude),
        googleMapsUrl: profile.googleMapsUrl ?? '',
      } : defaultBusinessProfile,
      estimatorRates,
      services: serviceResult.rows.length ? serviceResult.rows.map((row) => ({ id: row.id, name: row.name, description: row.description })) : initialized ? [] : defaultServices,
      serviceRates: rateResult.rows.length ? rateResult.rows.map((row) => ({ id: row.id, service: row.serviceLabel, unit: row.unit, startingRate: row.startingRate, details: row.details })) : initialized ? [] : defaultServiceRates,
      projects: projectResult.rows.length ? projectResult.rows.map((row) => ({
        id: row.id, title: row.title, location: row.location, type: row.type, diameter: row.diameter,
        depth: row.depth, date: row.date, status: row.status, description: row.description, image: row.image,
      })) : initialized ? [] : defaultProjects,
      serviceAreas: areaResult.rows.length ? areaResult.rows.map((row) => row.name) : initialized ? [] : defaultServiceAreas,
      faqs: faqResult.rows.length ? faqResult.rows.map((row) => ({ id: row.id, question: row.question, answer: row.answer })) : initialized ? [] : defaultFaqs,
      reviews: reviewResult.rows.length ? reviewResult.rows.map((row) => ({
        id: row.id, customerName: row.customerName, area: row.area, rating: row.rating, review: row.review, date: row.date,
        approved: row.approved, permissionToPublish: row.permissionToPublish,
      })) : initialized ? [] : defaultReviews,
    }
  } finally {
    client.release()
  }
}

export async function writeSiteDataToDatabase(data: SiteData, section: keyof SiteData) {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    if (section === 'businessProfile') {
      const profile = data.businessProfile
      const existingProfile = await client.query(`SELECT "id" FROM "BusinessProfile" ORDER BY "createdAt" ASC LIMIT 1`)
      if (existingProfile.rows[0]) {
        await client.query(
          `UPDATE "BusinessProfile" SET "businessName"=$2, "ownerName"=$3, "phone"=$4, "whatsapp"=$5, "email"=$6,
            "address"=$7, "city"=$8, "state"=$9, "businessHours"=$10, "experience"=$11, "latitude"=$12,
            "longitude"=$13, "googleMapsUrl"=$14, "updatedAt"=NOW() WHERE "id"=$1`,
          [existingProfile.rows[0].id, profile.businessName, profile.ownerName, profile.phone, profile.whatsapp, profile.email, profile.address, profile.city, profile.state, profile.businessHours, profile.experience, profile.latitude, profile.longitude, profile.googleMapsUrl],
        )
      } else {
        await client.query(
          `INSERT INTO "BusinessProfile" ("id", "businessName", "ownerName", "phone", "whatsapp", "email", "address", "city", "state", "businessHours", "experience", "latitude", "longitude", "googleMapsUrl", "createdAt", "updatedAt")
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,NOW(),NOW())`,
          [randomUUID(), profile.businessName, profile.ownerName, profile.phone, profile.whatsapp, profile.email, profile.address, profile.city, profile.state, profile.businessHours, profile.experience, profile.latitude, profile.longitude, profile.googleMapsUrl],
        )
      }
    } else if (section === 'services') {
      const serviceIds = data.services.map((item) => item.id)
      await client.query(`UPDATE "Enquiry" SET "serviceId"=NULL WHERE "serviceId" IS NOT NULL AND NOT ("serviceId" = ANY($1::text[]))`, [serviceIds])
      for (const service of data.services) {
        await client.query(
          `INSERT INTO "Service" ("id", "name", "description", "createdAt", "updatedAt") VALUES ($1,$2,$3,NOW(),NOW())
           ON CONFLICT ("id") DO UPDATE SET "name"=EXCLUDED."name", "description"=EXCLUDED."description", "updatedAt"=NOW()`,
          [service.id, service.name, service.description],
        )
      }
      await client.query(`DELETE FROM "Service" WHERE NOT ("id" = ANY($1::text[]))`, [serviceIds])
    } else if (section === 'serviceRates') {
      for (const rate of data.serviceRates) {
        await client.query(
          `INSERT INTO "ServiceRate" ("id", "serviceId", "serviceLabel", "unit", "startingRate", "details", "createdAt", "updatedAt")
           VALUES ($1,NULL,$2,$3,$4,$5,NOW(),NOW())
           ON CONFLICT ("id") DO UPDATE SET "serviceLabel"=EXCLUDED."serviceLabel", "unit"=EXCLUDED."unit",
             "startingRate"=EXCLUDED."startingRate", "details"=EXCLUDED."details", "updatedAt"=NOW()`,
          [rate.id, rate.service, rate.unit, rate.startingRate, rate.details],
        )
      }
    } else if (section === 'projects') {
      for (const project of data.projects) {
        await client.query(
          `INSERT INTO "Project" ("id", "title", "location", "type", "diameter", "depth", "date", "status", "description", "image", "createdAt", "updatedAt")
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,NOW(),NOW())
           ON CONFLICT ("id") DO UPDATE SET "title"=EXCLUDED."title", "location"=EXCLUDED."location", "type"=EXCLUDED."type",
            "diameter"=EXCLUDED."diameter", "depth"=EXCLUDED."depth", "date"=EXCLUDED."date", "status"=EXCLUDED."status",
            "description"=EXCLUDED."description", "image"=EXCLUDED."image", "updatedAt"=NOW()`,
          [project.id, project.title, project.location, project.type, project.diameter, project.depth, project.date, project.status, project.description, project.image],
        )
      }
    } else if (section === 'serviceAreas') {
      const areaNames = [...new Set(data.serviceAreas.map((area) => area.trim()).filter(Boolean))]
      const normalizedAreaNames = areaNames.map((area) => area.toLocaleLowerCase('en-US'))
      await client.query(
        `DELETE FROM "ServiceArea" WHERE NOT (lower("name") = ANY($1::text[]))`,
        [normalizedAreaNames],
      )
      for (const area of areaNames) {
        await client.query(
          `INSERT INTO "ServiceArea" ("id", "name", "createdAt", "updatedAt")
           SELECT $1::text,$2::varchar(200),NOW(),NOW()
           WHERE NOT EXISTS (SELECT 1 FROM "ServiceArea" WHERE lower("name")=lower($2::varchar(200)))`,
          [randomUUID(), area],
        )
      }
    } else if (section === 'faqs') {
      for (const faq of data.faqs) {
        await client.query(
          `INSERT INTO "Faq" ("id", "question", "answer", "createdAt", "updatedAt") VALUES ($1,$2,$3,NOW(),NOW())
           ON CONFLICT ("id") DO UPDATE SET "question"=EXCLUDED."question", "answer"=EXCLUDED."answer", "updatedAt"=NOW()`,
          [faq.id, faq.question, faq.answer],
        )
      }
    } else if (section === 'reviews') {
      const reviewIds = data.reviews.map((item) => item.id)
      for (const review of data.reviews) {
        if (review.approved && !review.permissionToPublish) {
          throw new Error('A review cannot be published without customer permission.')
        }
        await client.query(
          `INSERT INTO "Review" ("id", "customerName", "area", "rating", "review", "date", "approved", "permissionToPublish", "createdAt", "updatedAt")
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NOW(),NOW())
           ON CONFLICT ("id") DO UPDATE SET "customerName"=EXCLUDED."customerName", "area"=EXCLUDED."area",
            "rating"=EXCLUDED."rating", "review"=EXCLUDED."review", "date"=EXCLUDED."date",
            "approved"=EXCLUDED."approved", "permissionToPublish"=EXCLUDED."permissionToPublish", "updatedAt"=NOW()`,
          [review.id, review.customerName, review.area, review.rating, review.review, review.date, review.approved, review.permissionToPublish],
        )
      }
      await client.query(`DELETE FROM "Review" WHERE NOT ("id" = ANY($1::text[]))`, [reviewIds])
    } else if (section === 'estimatorRates') {
      await client.query(
        `INSERT INTO "AdminSetting" ("id", "key", "value", "createdAt", "updatedAt") VALUES ($1,$2,$3,NOW(),NOW())
         ON CONFLICT ("key") DO UPDATE SET "value"=EXCLUDED."value", "updatedAt"=NOW()`,
        [randomUUID(), 'borewellEstimatorRates', JSON.stringify(data.estimatorRates)],
      )
    }

    await client.query(
      `INSERT INTO "AdminSetting" ("id", "key", "value", "createdAt", "updatedAt") VALUES ($1,$2,$3,NOW(),NOW())
       ON CONFLICT ("key") DO UPDATE SET "value"=EXCLUDED."value", "updatedAt"=NOW()`,
      [randomUUID(), 'siteContentInitialized', '1'],
    )
    await client.query('COMMIT')
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}
