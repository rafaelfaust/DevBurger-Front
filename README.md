# DevBurger

Base comercial white-label para delivery construída com Next.js, TypeScript e
Checkout Pro do Mercado Pago.

## White-label

O projeto agora possui uma camada inicial de white-label baseada em variáveis de
ambiente. Nome da marca, wordmark, descrições, textos principais, namespace de
cookies/carrinho e descriptor do checkout podem ser personalizados sem alterar o
código. A integração com backend também aceita aliases genéricos para evitar
acoplamento ao nome do cliente original.

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
APP_BACKEND_URL=http://localhost:3001
MERCADO_PAGO_ACCESS_TOKEN=TEST-...
MERCADO_PAGO_WEBHOOK_SECRET=
APP_SERVICE_TOKEN=
ALLOW_DEMO_CATALOG=true
```

- `MERCADO_PAGO_ACCESS_TOKEN`: credencial privada da aplicação Mercado Pago.
- `MERCADO_PAGO_WEBHOOK_SECRET`: assinatura exibida em **Suas integrações >
  Webhooks**.
- `APP_BACKEND_URL`: endpoint principal do backend da operação. O alias legado
  `DEV_BURGER_API_URL` continua aceito para compatibilidade.
- `APP_SERVICE_TOKEN`: token de serviço usado pelo webhook para atualizar
  pedidos. O alias legado `DEV_BURGER_SERVICE_TOKEN` continua aceito.
- `NEXT_PUBLIC_APP_NAMESPACE`: evita colisão de cookies e carrinho entre marcas
  diferentes que usem a mesma base.
- `NEXT_PUBLIC_BRAND_*`: controla nome, identidade textual e conteúdo principal
  da storefront.
- `NEXT_PUBLIC_THEME_*`: controla as cores principais da interface sem editar o
  CSS base.
- `ALLOW_DEMO_CATALOG`: mantém o catálogo de demonstração disponível quando a
  API externa está fora do ar. Use `false` em produção.

Nunca exponha o Access Token com prefixo `NEXT_PUBLIC_`.

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
