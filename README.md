# DevBurger

Base comercial white-label para delivery construída com Next.js, TypeScript e
Checkout Pro do Mercado Pago.

## White-label

Cada loja (restaurante) fica no banco com sua marca: nome, textos, cores e
imagens. O dono edita tudo em **Admin → Aparência**, e taxa de entrega e formas
de pagamento em **Admin → Configurações**. Uma única instância serve várias
lojas; a loja é escolhida pelo endereço acessado (veja Multi-tenant).

## Stack

- Next.js 16 com App Router
- React 19 e TypeScript
- Mercado Pago SDK para criação de preferências e consulta de pagamentos
- Postgres com Drizzle ORM (PGlite embutido em desenvolvimento)
- Sessões no banco, cookie `httpOnly` só com token opaco
- Server Components para catálogo e páginas administrativas

## Configuração local

Requer Node.js 20.19 ou superior.

```bash
npm install
copy .env.example .env.local
npm run db:setup
npm run dev
```

Abra `http://localhost:3000`.

## Variáveis de ambiente

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAMESPACE=sua-marca
NEXT_PUBLIC_BRAND_NAME=Sua Marca
NEXT_PUBLIC_BRAND_WORDMARK_LEAD=SUA
NEXT_PUBLIC_BRAND_WORDMARK_TRAIL=MARCA
NEXT_PUBLIC_BRAND_LOGO_PATH=/assets/logo.png
NEXT_PUBLIC_BRAND_FAVICON_PATH=/assets/logo.png
NEXT_PUBLIC_BRAND_HOME_HERO_PATH=/assets/bannerHome.webp
NEXT_PUBLIC_BRAND_CATALOG_HERO_PATH=/assets/bannerProduct.webp
NEXT_PUBLIC_BRAND_LOGIN_IMAGE_PATH=/assets/login-img.webp
NEXT_PUBLIC_BRAND_REGISTER_IMAGE_PATH=/assets/user-img.webp
NEXT_PUBLIC_SITE_DESCRIPTION=Plataforma white-label para delivery, catálogo digital, pedidos e checkout online.
NEXT_PUBLIC_FOOTER_TAGLINE=Operação digital pronta para vender com a identidade do seu cliente.
NEXT_PUBLIC_HOME_EYEBROW=White-label para delivery e restaurantes
NEXT_PUBLIC_HOME_TITLE_PREFIX=Seu delivery pronto para
NEXT_PUBLIC_HOME_TITLE_HIGHLIGHT=vender
NEXT_PUBLIC_HOME_TITLE_SUFFIX=online.
NEXT_PUBLIC_HOME_COPY=Catálogo, carrinho, checkout seguro e operação administrativa em uma única plataforma white-label.
NEXT_PUBLIC_HOME_IMAGE_ALT=Sua Marca em destaque
NEXT_PUBLIC_HOME_HIGHLIGHT_TITLE=Produtos em destaque
NEXT_PUBLIC_PRODUCTS_DESCRIPTION=Explore o catálogo completo da Sua Marca.
NEXT_PUBLIC_PRODUCTS_EYEBROW=Catálogo digital
NEXT_PUBLIC_PRODUCTS_TITLE=Cardápio Sua Marca
NEXT_PUBLIC_PRODUCTS_COPY=Produtos organizados para conversão, operação rápida e atualização simples.
NEXT_PUBLIC_LOADING_LABEL=Carregando Sua Marca...
NEXT_PUBLIC_API_ERROR_LABEL=Verifique a integração principal da Sua Marca e tente novamente.
NEXT_PUBLIC_BRAND_STATEMENT_DESCRIPTOR=SUA MARCA
NEXT_PUBLIC_THEME_INK=#171512
NEXT_PUBLIC_THEME_MUTED=#6f6a62
NEXT_PUBLIC_THEME_PAPER=#f7f3eb
NEXT_PUBLIC_THEME_CARD=#fffdf8
NEXT_PUBLIC_THEME_PRIMARY=#f5b82e
NEXT_PUBLIC_THEME_PRIMARY_DARK=#d89300
NEXT_PUBLIC_THEME_ACCENT=#b9271e
NEXT_PUBLIC_THEME_LINE=#ddd5c8
NEXT_PUBLIC_THEME_SUCCESS=#1c7a45
ALLOW_DEMO_CHECKOUT=true
APP_BACKEND_URL=
MERCADO_PAGO_ACCESS_TOKEN=
MERCADO_PAGO_WEBHOOK_SECRET=
APP_SERVICE_TOKEN=
```

- `MERCADO_PAGO_ACCESS_TOKEN`: credencial privada da aplicação Mercado Pago.
- `MERCADO_PAGO_WEBHOOK_SECRET`: assinatura exibida em **Suas integrações >
  Webhooks**.
- `NEXT_PUBLIC_APP_NAMESPACE`: slug da loja padrão, aberta quando o endereço
  não corresponde a nenhuma loja (localhost, `*.vercel.app`).
- `PLATFORM_DOMAIN`: domínio da plataforma. Com `devburger.app`, o endereço
  `pizzaria.devburger.app` abre a loja de slug `pizzaria`.
- `NEXT_PUBLIC_BRAND_*`, `NEXT_PUBLIC_THEME_*` e `APP_TENANT_CONFIG`: só servem
  de semente para o `npm run db:seed`. Depois disso a marca é editada pelo
  painel.
- `DATABASE_URL`: Postgres (Neon, Supabase etc.). Vazio em desenvolvimento usa
  PGlite em `.data/pglite`. Obrigatório em produção.
- `ALLOW_DEMO_CHECKOUT`: simula aprovação local do checkout quando você quer
  testar sem Mercado Pago. Ignorado em produção.

Nunca exponha o Access Token com prefixo `NEXT_PUBLIC_`.

## Multi-tenant

A loja de cada requisição é encontrada nesta ordem:

1. Domínio próprio cadastrado na tabela `tenant_domains`
   (ex.: `pedidos.hamburgueria.com.br`).
2. Subdomínio de `PLATFORM_DOMAIN` (ex.: `pizzaria.devburger.app`).
3. Loja padrão (`NEXT_PUBLIC_APP_NAMESPACE`).

Para criar lojas de exemplo, descreva-as em `APP_TENANT_CONFIG` e rode
`npm run db:seed`. Os `hosts` viram domínios da loja; curingas (`*.`) são
ignorados, pois `PLATFORM_DOMAIN` cobre esse caso.

Exemplo:

```env
APP_TENANT_CONFIG='[{"key":"acai-prime","hosts":["acai.localhost","acai.exemplo.com","*.acai.exemplo.com"],"branding":{"brandName":"Acai Prime","brandWordmarkLead":"ACAI","brandWordmarkTrail":"PRIME","namespace":"acai-prime","siteDescription":"Delivery premium com checkout online.","homeTitleHighlight":"entregar","assets":{"logoPath":"/tenants/acai-prime/logo.svg","faviconPath":"/tenants/acai-prime/favicon.svg","homeHeroPath":"/tenants/acai-prime/home-hero.svg","catalogHeroPath":"/tenants/acai-prime/catalog-hero.svg","loginImagePath":"/tenants/acai-prime/login-hero.svg","registerImagePath":"/tenants/acai-prime/register-hero.svg"},"theme":{"primary":"#6d28d9","accent":"#1d4ed8","paper":"#f8f7ff"}}},{"key":"pizza-flow","hosts":["pizza.localhost","pizza.exemplo.com"],"branding":{"brandName":"Pizza Flow","brandWordmarkLead":"PIZZA","brandWordmarkTrail":"FLOW","namespace":"pizza-flow","homeTitleHighlight":"faturar","assets":{"logoPath":"/tenants/pizza-flow/logo.svg","faviconPath":"/tenants/pizza-flow/favicon.svg","homeHeroPath":"/tenants/pizza-flow/home-hero.svg","catalogHeroPath":"/tenants/pizza-flow/catalog-hero.svg","loginImagePath":"/tenants/pizza-flow/login-hero.svg","registerImagePath":"/tenants/pizza-flow/register-hero.svg"},"theme":{"primary":"#f97316","accent":"#b91c1c","paper":"#fff7ed"}}}]'
```

Importante: como o JSON pode conter `#` nas cores do tema, coloque o valor
inteiro entre aspas simples no `.env.local`.

Campos mais úteis dentro de `branding` (`namespace` vira o slug da loja):

- `brandName`, `brandWordmarkLead`, `brandWordmarkTrail`
- `namespace`
- `assets.logoPath`, `assets.faviconPath`, `assets.homeHeroPath`
- `assets.catalogHeroPath`, `assets.loginImagePath`, `assets.registerImagePath`
- `siteDescription`, `footerTagline`
- `homeTitlePrefix`, `homeTitleHighlight`, `homeTitleSuffix`
- `productsTitle`, `productsDescription`
- `statementDescriptor`
- `theme.primary`, `theme.primaryDark`, `theme.accent`, `theme.paper`, `theme.card`

## Mercado Pago

O fluxo implementado usa Checkout Pro:

1. O navegador envia apenas IDs e quantidades.
2. O servidor recupera produtos e preços do catálogo.
3. O pedido é gravado com itens, taxa de entrega e total calculados no servidor.
4. O Next cria uma preferência e redireciona para o Mercado Pago.
5. O webhook valida a assinatura e consulta o pagamento diretamente na API.
6. Pagamentos aprovados confirmam o pedido se o valor pago cobrir o total.

Cadastre a URL abaixo no painel do Mercado Pago:

```text
https://seu-dominio.com/api/webhooks/mercadopago
```

Para testes locais de webhook, use um túnel HTTPS e atualize
`NEXT_PUBLIC_APP_URL`.

## Comandos

```bash
npm run dev
npm run db:setup     # aplica migrações e cria as lojas configuradas
npm run db:generate  # gera migração após alterar lib/db/schema.ts
npm run db:studio    # interface do banco
npm run lint
npm run typecheck
npm run build
npm start
```

## Teste local

`npm run db:setup` cria no banco cada loja configurada (branding padrão e
`APP_TENANT_CONFIG`) com catálogo de demonstração. Lojas existentes são
mantidas. Com PGlite, pare o `npm run dev` antes de rodar os scripts `db:*`:
apenas um processo acessa o banco embutido por vez.

Credenciais iniciais por tenant:

- Admin: `admin@<namespace>.local` com senha `123456`
- Cliente: `cliente@<namespace>.local` com senha `123456`

Exemplo: para `NEXT_PUBLIC_APP_NAMESPACE=sua-marca`, use
`admin@sua-marca.local`.

## Deploy

O projeto requer runtime Node.js e não deve ser publicado como exportação
estática, pois checkout, autenticação e webhooks executam no servidor.

Antes de produção:

- Use credenciais produtivas do Mercado Pago.
- Configure `DATABASE_URL` e rode `npm run db:setup` contra esse banco.
- Configure domínio, webhook e política de privacidade.

## Licença

MIT. Consulte [LICENSE](LICENSE).
