'use client'

export default function ErrorPage({
  reset
}: {
  error: Error
  reset: () => void
}) {
  return (
    <main className="empty-state error-state">
      <h1>Não conseguimos carregar esta página</h1>
      <p>Tente novamente em alguns instantes.</p>
      <button className="button" onClick={reset}>
        Tentar novamente
      </button>
    </main>
  )
}
