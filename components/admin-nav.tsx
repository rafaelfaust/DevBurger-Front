import { ClipboardList, Clock, MessageCircle, Palette, PlusCircle, Settings, Tags, Utensils } from 'lucide-react'
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
      <Link href="/admin/categorias">
        <Tags size={19} /> Categorias
      </Link>
      <Link href="/admin/configuracoes">
        <Settings size={19} /> Configurações
      </Link>
      <Link href="/admin/whatsapp">
        <MessageCircle size={19} /> WhatsApp
      </Link>
      <Link href="/admin/horarios">
        <Clock size={19} /> Horários
      </Link>
      <Link href="/admin/aparencia">
        <Palette size={19} /> Aparência
      </Link>
    </aside>
  )
}
