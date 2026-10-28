'use client'

import { Printer } from 'lucide-react'

import { printOrder, savePrintSettings, usePrintSettings } from '@/lib/print-settings'

export function PrintOrderButton({ orderId }: { orderId: string }) {
  return (
    <button className="text-button" onClick={() => printOrder(orderId)} type="button">
      <Printer size={16} /> Imprimir
    </button>
  )
}

// Configuração da impressora deste aparelho (fica salva no navegador).
export function PrintSettingsForm() {
  const settings = usePrintSettings()

  return (
    <div className="print-settings">
      <label>
        <Printer size={18} /> Papel
        <select
          onChange={event => savePrintSettings({ ...settings, paper: event.target.value === '58' ? '58' : '80' })}
          value={settings.paper}
        >
          <option value="80">80 mm</option>
          <option value="58">58 mm</option>
        </select>
      </label>
      <label>
        Vias
        <select
          onChange={event => savePrintSettings({ ...settings, copies: event.target.value === '2' ? 2 : 1 })}
          value={settings.copies}
        >
          <option value="1">1 via</option>
          <option value="2">2 vias (cozinha e entrega)</option>
        </select>
      </label>
      <label className="checkbox">
        <input
          checked={settings.auto}
          onChange={event => savePrintSettings({ ...settings, auto: event.target.checked })}
          type="checkbox"
        />
        Imprimir sozinho quando chegar pedido
      </label>
      <small>
        Vale só para este aparelho. Para imprimir sem a janela de confirmação, abra o painel no Chrome
        com a opção --kiosk-printing e deixe a impressora térmica como padrão do Windows.
      </small>
    </div>
  )
}
