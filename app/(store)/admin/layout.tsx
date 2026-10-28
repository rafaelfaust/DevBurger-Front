import { redirect } from 'next/navigation'

import { AdminNav } from '@/components/admin-nav'
import { OrdersAlert } from '@/components/orders-alert'
import { getSessionUser } from '@/lib/auth'

export default async function AdminLayout({
  children
}: {
  children: React.ReactNode
}) {
  const user = await getSessionUser()
  if (!user) redirect('/login')
  if (!user.admin) redirect('/')

  return (
    <main className="admin-layout">
      <AdminNav />
      <section className="admin-content">
        <OrdersAlert />
        {children}
      </section>
    </main>
  )
}
