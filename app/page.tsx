import { ArrowRight, Clock3, ShieldCheck, Truck } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

import { ProductCard } from '@/components/product-card'
import { getProducts } from '@/lib/api'
import { getTenantBranding } from '@/lib/branding'

export default async function HomePage() {
  const [products, branding] = await Promise.all([getProducts(), getTenantBranding()])
  const offers = products.filter(product => product.offer).slice(0, 4)
  const highlights = offers.length ? offers : products.slice(0, 4)

  return (
    <main>
      <section className="hero">
        <div className="hero-content">
          <p className="eyebrow">{branding.homeEyebrow}</p>
          <h1>
            {branding.homeTitlePrefix} <span>{branding.homeTitleHighlight}</span>{' '}
            {branding.homeTitleSuffix}
          </h1>
          <p className="hero-copy">{branding.homeCopy}</p>
          <div className="hero-actions">
            <Link className="button" href="/produtos">
              Ver cardápio <ArrowRight size={19} />
            </Link>
            <span className="delivery-time">
              <Clock3 size={19} /> Entrega média em 35 min
            </span>
          </div>
        </div>
        <div className="hero-art">
          <div className="hero-image-wrap">
            <Image
              alt={branding.homeImageAlt}
              fill
              priority
              sizes="(max-width: 900px) 100vw, 50vw"
              src="/assets/bannerHome.webp"
            />
          </div>
          <div className="hero-stamp">100% artesanal</div>
        </div>
      </section>

      <section className="benefits">
        <div>
          <Truck />
          <span>
            <strong>Entrega rápida</strong>
            Na sua porta, ainda quente
          </span>
        </div>
        <div>
          <ShieldCheck />
          <span>
            <strong>Pagamento seguro</strong>
            Protegido pelo Mercado Pago
          </span>
        </div>
        <div>
          <Clock3 />
          <span>
            <strong>Feito na hora</strong>
            Sem atalhos, sem congelados
          </span>
        </div>
      </section>

      <section className="section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Os mais pedidos</p>
            <h2>{branding.homeHighlightTitle}</h2>
          </div>
          <Link href="/produtos">Cardápio completo →</Link>
        </div>
        <div className="product-grid">
          {highlights.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
    </main>
  )
}
