import { WhatsAppPanel } from '@/components/whatsapp-panel'
import { getWhatsAppAdmin } from '@/lib/whatsapp/admin'

export default async function WhatsAppPage() {
  const data = await getWhatsAppAdmin()

  return (
    <>
      <div className="admin-heading">
        <p className="eyebrow">Atendimento</p>
        <h1>WhatsApp</h1>
        <p className="settings-hint">Avisos automáticos para o cliente a cada etapa do pedido.</p>
      </div>
      <WhatsAppPanel {...data} />
    </>
  )
}
