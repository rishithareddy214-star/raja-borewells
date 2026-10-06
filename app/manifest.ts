import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Raja Borewells',
    short_name: 'Raja Borewells',
    description: 'Borewell drilling and water solutions in Hyderabad.',
    start_url: '/',
    display: 'standalone',
    background_color: '#f8fbff',
    theme_color: '#082f49',
    icons: [{ src: '/favicon.ico', sizes: 'any', type: 'image/x-icon' }],
  }
}
