import Image from 'next/image'

import { getProducts } from '@/lib/api'
import { formatCurrency } from '@/lib/format'

export default async function AdminProductsPage() {
  const products = await getProducts()

  return (
    <>
      <div className="admin-heading">
        <p className="eyebrow">Catálogo</p>
        <h1>Produtos</h1>
      </div>
      <div className="admin-product-grid">
        {products.map(product => (
          <article key={product.id}>
            <Image alt={product.name} height={90} src={product.url} width={110} />
            <div>
              <h3>{product.name}</h3>
              <strong>{formatCurrency(product.price)}</strong>
            </div>
            {product.offer && <span>Oferta</span>}
          </article>
        ))}
      </div>
    </>
  )
}
