'use client'

import { useEffect } from 'react'

export function ContactClickTracker() {
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const target = event.target
      if (!(target instanceof Element)) return
      const anchor = target.closest('a')
      if (!(anchor instanceof HTMLAnchorElement)) return

      const type = anchor.href.startsWith('tel:')
        ? 'call'
        : anchor.href.includes('wa.me')
          ? 'whatsapp'
          : /quote/i.test(anchor.hash)
            ? 'quote'
            : /site.visit/i.test(anchor.hash)
              ? 'site-visit'
              : null
      if (!type) return

      const width = window.innerWidth
      const deviceType = width < 768 ? 'mobile' : width < 1024 ? 'tablet' : 'desktop'
      void fetch('/api/track', {
        method: 'POST',
        keepalive: true,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactType: type,
          sourcePage: window.location.pathname,
          serviceId: anchor.dataset.serviceId,
          area: anchor.dataset.area,
          deviceType,
        }),
      }).catch((error: unknown) => console.error('Could not track contact click', error))
    }
    document.addEventListener('click', onClick)
    return () => document.removeEventListener('click', onClick)
  }, [])

  return null
}
