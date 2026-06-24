# DevBurger

Base comercial white-label para delivery construída com Next.js, TypeScript e
Checkout Pro do Mercado Pago.

## White-label

O projeto agora possui uma camada inicial de white-label baseada em variáveis de
ambiente. Nome da marca, wordmark, descrições, textos principais, namespace de
cookies/carrinho e descriptor do checkout podem ser personalizados sem alterar o
código. A integração com backend também aceita aliases genéricos para evitar
acoplamento ao nome do cliente original.

Também é possível resolver branding por domínio ou subdomínio usando
`APP_TENANT_CONFIG`, o que permite servir múltiplos clientes a partir da mesma
instância.

## Stack

- Next.js 16 com App Router
- React 19 e TypeScript
- Mercado Pago SDK para criação de preferências e consulta de pagamentos
- Cookies `httpOnly` para autenticação
- Server Components para catálogo e páginas administrativas

## Configuração local

Requer Node.js 20.19 ou superior.

```bash
npm install
copy .env.example .env.local
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
- `APP_BACKEND_URL`: legado opcional. A storefront agora usa persistência local
  dentro do Next por padrão.
- `APP_SERVICE_TOKEN`: token de serviço usado pelo webhook para atualizar
  pedidos. O alias legado `DEV_BURGER_SERVICE_TOKEN` continua aceito.
- `APP_TENANT_CONFIG`: JSON opcional para mapear hosts para branding específico
  por tenant.
- `NEXT_PUBLIC_APP_NAMESPACE`: evita colisão de cookies e carrinho entre marcas
  diferentes que usem a mesma base.
- `NEXT_PUBLIC_BRAND_*`: controla nome, identidade textual e conteúdo principal
  da storefront.
- `NEXT_PUBLIC_BRAND_*_PATH`: controla logo, favicon e imagens principais por
  marca.
- `NEXT_PUBLIC_THEME_*`: controla as cores principais da interface sem editar o
  CSS base.
- `ALLOW_DEMO_CHECKOUT`: simula aprovação local do checkout quando você quer
  testar sem Mercado Pago.

Nunca exponha o Access Token com prefixo `NEXT_PUBLIC_`.

## Multi-tenant

Use `APP_TENANT_CONFIG` para declarar tenants por host. A resolução aceita host
exato e curingas simples como `*.cliente.com`, o que já cobre domínio
customizado em produção.

Exemplo:

```env
APP_TENANT_CONFIG='[{"key":"acai-prime","hosts":["acai.localhost","acai.exemplo.com","*.acai.exemplo.com"],"branding":{"brandName":"Acai Prime","brandWordmarkLead":"ACAI","brandWordmarkTrail":"PRIME","namespace":"acai-prime","siteDescription":"Delivery premium com checkout online.","homeTitleHighlight":"entregar","assets":{"logoPath":"/tenants/acai-prime/logo.svg","faviconPath":"/tenants/acai-prime/favicon.svg","homeHeroPath":"/tenants/acai-prime/home-hero.svg","catalogHeroPath":"/tenants/acai-prime/catalog-hero.svg","loginImagePath":"/tenants/acai-prime/login-hero.svg","registerImagePath":"/tenants/acai-prime/register-hero.svg"},"theme":{"primary":"#6d28d9","accent":"#1d4ed8","paper":"#f8f7ff"}}},{"key":"pizza-flow","hosts":["pizza.localhost","pizza.exemplo.com"],"branding":{"brandName":"Pizza Flow","brandWordmarkLead":"PIZZA","brandWordmarkTrail":"FLOW","namespace":"pizza-flow","homeTitleHighlight":"faturar","assets":{"logoPath":"/tenants/pizza-flow/logo.svg","faviconPath":"/tenants/pizza-flow/favicon.svg","homeHeroPath":"/tenants/pizza-flow/home-hero.svg","catalogHeroPath":"/tenants/pizza-flow/catalog-hero.svg","loginImagePath":"/tenants/pizza-flow/login-hero.svg","registerImagePath":"/tenants/pizza-flow/register-hero.svg"},"theme":{"primary":"#f97316","accent":"#b91c1c","paper":"#fff7ed"}}}]'
```

Importante: como o JSON pode conter `#` nas cores do tema, coloque o valor
inteiro entre aspas simples no `.env.local`.

Campos mais úteis dentro de `branding`:

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
3. Um pedido é criado no backend quando o cliente está autenticado.
4. O Next cria uma preferência e redireciona para o Mercado Pago.
5. O webhook valida a assinatura e consulta o pagamento diretamente na API.
6. Pagamentos aprovados atualizam o pedido quando há um token de serviço.

Cadastre a URL abaixo no painel do Mercado Pago:

```text
https://seu-dominio.com/api/webhooks/mercadopago
```

Para testes locais de webhook, use um túnel HTTPS e atualize
`NEXT_PUBLIC_APP_URL`.

## Comandos

```bash
npm run dev
npm run lint
npm run typecheck
npm run build
npm start
```

## Teste local

Sem configurar nada além do `.env.local`, o projeto já cria sementes por tenant
no primeiro acesso em `.data/store.json`.

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
- Defina `ALLOW_DEMO_CATALOG=false`.
- Disponibilize a API em HTTPS.
- Crie um token de serviço restrito à atualização de pedidos.
- Configure domínio, webhook e política de privacidade.

## Licença

MIT. Consulte [LICENSE](LICENSE).
