import { ClipboardList, PlusCircle, Utensils } from 'lucide-react'
import Link from 'next/link'

export function AdminNav() {
  return (
    <aside className="admin-nav">
      <p>Administração</p>
      <Link href="/admin/pedidos">
        <ClipboardList size={19} /> Pedidos
      </Link>
      <Link href="/admin/produtos">
        <Utensils size={19} /> Produtos
      </Link>
      <Link href="/admin/produtos/novo">
        <PlusCircle size={19} /> Novo produto
      </Link>
    </aside>
  )
}
