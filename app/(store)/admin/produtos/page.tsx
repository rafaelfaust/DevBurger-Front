import Image from 'next/image'
import Link from 'next/link'

import { ProductRowActions } from '@/components/product-row-actions'
import { formatCurrency } from '@/lib/format'
import { getAdminProducts, getStoreSettings } from '@/lib/store'

export default async function AdminProductsPage() {
  const [products, settings] = await Promise.all([getAdminProducts(), getStoreSettings()])
  const paused = products.filter(product => !product.active).length
  // A lista já vem ordenada por categoria; agrupa mantendo a ordem.
  const groups = products.reduce<Array<{ name: string; items: typeof products }>>((acc, product) => {
    const last = acc.at(-1)
    if (last?.name === product.categoryName) last.items.push(product)
    else acc.push({ name: product.categoryName, items: [product] })
    return acc
  }, [])

  return (
    <>
      <div className="admin-heading admin-heading-row">
        <div>
          <p className="eyebrow">Catálogo</p>
          <h1>Produtos</h1>
          <p className="settings-hint">
            {products.length} {products.length === 1 ? 'produto' : 'produtos'}
            {paused > 0 && ` · ${paused} pausado${paused > 1 ? 's' : ''} (fora do cardápio)`}
          </p>
        </div>
        <Link className="button" href="/admin/produtos/novo">
          Novo produto
        </Link>
      </div>

      {groups.map(group => (
        <section className="admin-product-group" key={group.name}>
          <h2>{group.name}</h2>
          <div className="admin-product-grid">
            {group.items.map(product => (
              <article className={product.active ? undefined : 'is-paused'} key={product.id}>
                <Image alt={product.name} height={90} src={product.url} width={110} />
                <div className="admin-product-info">
                  <h3>{product.name}</h3>
                  {product.description && <p className="settings-hint">{product.description}</p>}
                  <strong>{formatCurrency(product.price)}</strong>
                  <div className="admin-product-badges">
                    {product.offer && <span className="badge-offer">Oferta</span>}
                    {!product.active && <span className="badge-paused">Pausado</span>}
                    {settings.stockControl &&
                      (product.stockQuantity === null ? (
                        <span className="badge-stock">Sem limite</span>
                      ) : product.stockQuantity <= 0 ? (
                        <span className="badge-soldout">Esgotado</span>
                      ) : (
                        <span className="badge-stock">{product.stockQuantity} em estoque</span>
                      ))}
                  </div>
                </div>
                <ProductRowActions active={product.active} id={product.id} name={product.name} />
              </article>
            ))}
          </div>
        </section>
      ))}
      {!products.length && <p className="settings-hint">Nenhum produto ainda.</p>}
    </>
  )
}
