# Empresa com Claude - Front

Landing page estatica em Vite para `https://juliaferreiraceo.com.br`.

## Deploy

- Base directory no Netlify: raiz do repositório
- Build command: `npm run build`
- Publish directory: `dist`

## Rotas

- `/`
- `/opcao-1/`
- `/imersao-empresa-com-claude-v1/`
- `/rotina-anti-caos/`

## Analytics

Todas as paginas HTML do projeto devem incluir o bloco abaixo imediatamente apos a abertura de `<head>`.
Ao criar uma nova rota/pagina, copie o snippet antes das demais tags do head:

```html
<script async src="https://www.googletagmanager.com/gtm.js?id=GTM-5SJWHNCX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
</script>
```

## Checkout

Configure a URL de checkout no provedor de deploy usando `VITE_CHECKOUT_URL`.

## API

A API do front deve ficar separada do front estatico:

Configure a URL publica da API no provedor de deploy usando `VITE_BACKEND_API_BASE_URL`.

O formulario do front envia `POST` para:

```text
${VITE_BACKEND_API_BASE_URL}/api/leads
```

A ferramenta `/rotina-anti-caos/` envia respostas estruturadas para:

```text
${VITE_BACKEND_API_BASE_URL}/api/rotina-anti-caos
```

A rota `/imersao-empresa-com-claude-v1/` registra visualizacoes em:

```text
${VITE_BACKEND_API_BASE_URL}/api/page-views
```

Esses eventos sao gravados no Supabase em `ecc.page_views`.

Variaveis publicas para build no provedor de deploy:

```text
VITE_BACKEND_API_BASE_URL=
VITE_CHECKOUT_URL=
```

Apos resposta `2xx` da API, o front redireciona para `checkout_url` retornado pela API ou para `VITE_CHECKOUT_URL`.

Nao use variaveis `VITE_*` para segredos. Tudo que comeca com `VITE_` fica publico no JavaScript final.

Porta local planejada na VPS:

```text
127.0.0.1:39183
```

CORS deve permitir apenas as origins publicas do front. CORS nao valida sub-path, entao qualquer rota dentro do dominio configurado fica coberta por esta origin.

## Seguranca

Arquivos `.env`, `node_modules`, `dist`, `api` e `infra` nao devem ser enviados ao GitHub.

A seguranca real do formulario deve ficar no backend: validacao de origin, honeypot, rate limit, validacao de campos e credenciais do Supabase somente no servidor.
