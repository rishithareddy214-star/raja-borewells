import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { adminCookieName, createAdminCookieValue } from '@/lib/admin-auth'
import { isRateLimited, requestKey } from '@/lib/rate-limit'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(200),
})

export async function POST(request: Request) {
  if (isRateLimited(`admin-login:${requestKey(request)}`, 5, 15 * 60 * 1000)) {
    return Response.json({ error: 'Too many login attempts. Try again later.' }, { status: 429 })
  }
  if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD_HASH) {
    return Response.json({ error: 'Admin credentials are not configured on the server.' }, { status: 503 })
  }

  try {
    const { email, password } = loginSchema.parse(await request.json())
    const matches = await bcrypt.compare(password, process.env.ADMIN_PASSWORD_HASH)

    if (email.toLowerCase() !== process.env.ADMIN_EMAIL.toLowerCase() || !matches) {
      return Response.json({ error: 'Invalid admin credentials.' }, { status: 401 })
    }

    const response = Response.json({ success: true, message: 'Admin login successful.' })
    response.headers.append(
      'Set-Cookie',
      `${adminCookieName}=${createAdminCookieValue()}; Path=/; HttpOnly; SameSite=Strict; Max-Age=28800${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`,
    )
    return response
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: 'Please enter a valid email and password.' }, { status: 400 })
    }
    console.error('Admin login failed', error)
    return Response.json({ error: 'Admin login is not available. Check the server session configuration.' }, { status: 503 })
  }
}
