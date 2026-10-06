import { redirect } from 'next/navigation'
import { AdminDashboard } from '@/components/AdminDashboard'
import { readSiteData } from '@/lib/site-data'
import { isAdminAuthenticated } from '@/lib/admin-auth'

export default async function AdminPage() {
  if (!(await isAdminAuthenticated())) {
    redirect('/admin/login')
  }

  const data = await readSiteData()

  return <AdminDashboard initialData={data} />
}
