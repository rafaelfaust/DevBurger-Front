import { CheckCircle2, CircleX, Clock3, ReceiptText } from 'lucide-react'
import Link from 'next/link'

const content = {
  recebido: {
    icon: ReceiptText,
    title: 'Pedido enviado',
    text: 'A loja já recebeu seu pedido. O pagamento é feito na entrega.'
  },
  sucesso: {
    icon: CheckCircle2,
    title: 'Pagamento aprovado',
    text: 'Recebemos a confirmação. Seu pedido seguirá para a cozinha.'
  },
  pendente: {
    icon: Clock3,
    title: 'Pagamento em análise',
    text: 'O Mercado Pago está processando seu pagamento. Avisaremos quando houver atualização.'
  },
  falha: {
    icon: CircleX,
    title: 'Pagamento não concluído',
    text: 'Não houve cobrança. Revise os dados e tente novamente.'
  }
}

export default async function PaymentStatusPage({
  params
}: {
  params: Promise<{ status: string }>
}) {
  const { status } = await params
  const selected = content[status as keyof typeof content] ?? content.falha
  const Icon = selected.icon

  return (
    <main className="payment-result">
      <Icon size={72} />
      <p className="eyebrow">Status do pagamento</p>
      <h1>{selected.title}</h1>
      <p>{selected.text}</p>
      <div>
        <Link className="button" href="/produtos">
          Voltar ao cardápio
        </Link>
      </div>
    </main>
  )
}
