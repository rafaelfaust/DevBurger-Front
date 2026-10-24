import { ClipboardList, Palette, PlusCircle, Settings, Utensils } from 'lucide-react'
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
      <Link href="/admin/configuracoes">
        <Settings size={19} /> Configurações
      </Link>
      <Link href="/admin/aparencia">
        <Palette size={19} /> Aparência
      </Link>
    </aside>
  )
}
