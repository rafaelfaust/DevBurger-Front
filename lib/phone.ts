// Celular brasileiro: guardado só com dígitos e DDI (5511987654321).

// Aceita "(11) 98765-4321", "11987654321", "+55 11 98765-4321"... Devolve null se não for celular.
export function normalizeBrMobile(input: string): string | null {
  let digits = input.replace(/\D/g, '')
  if (digits.length === 13 && digits.startsWith('55')) digits = digits.slice(2)
  // DDD (11 a 99) + 9 + oito dígitos
  if (!/^[1-9][1-9]9\d{8}$/.test(digits)) return null
  return `55${digits}`
}

// 5511987654321 -> (11) 98765-4321
export function formatBrPhone(stored: string) {
  const local = stored.startsWith('55') ? stored.slice(2) : stored
  if (local.length !== 11) return stored
  return `(${local.slice(0, 2)}) ${local.slice(2, 7)}-${local.slice(7)}`
}

// Link que abre a conversa no WhatsApp (com mensagem pronta, se houver).
export function whatsappLink(stored: string, text?: string) {
  return `https://wa.me/${stored}${text ? `?text=${encodeURIComponent(text)}` : ''}`
}
