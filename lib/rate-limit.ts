const buckets = new Map<string, { count: number; expiresAt: number }>()

export function requestKey(request: Request) {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || 'unknown'
}

export function isRateLimited(key: string, limit = 8, windowMs = 10 * 60 * 1000) {
  const now = Date.now()
  if (buckets.size > 5000) {
    for (const [bucketKey, bucket] of buckets) {
      if (bucket.expiresAt <= now) buckets.delete(bucketKey)
    }
  }

  const bucket = buckets.get(key)
  if (!bucket || bucket.expiresAt <= now) {
    buckets.set(key, { count: 1, expiresAt: now + windowMs })
    return false
  }
  bucket.count += 1
  return bucket.count > limit
}
