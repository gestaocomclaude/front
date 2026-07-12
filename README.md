# Empresa com Claude - Front

Landing page estatica em Vite para `https://juliaferreiraceo.com.br`.

## Deploy

- Base directory no Netlify: raiz do repositório
- Build command: `npm run build`
- Publish directory: `dist`

## Rotas

- `/`
- `/opcao-1/`

## Checkout

CTAs principais apontam para:

```text
https://pay.hub.la/4d1706OPAXBCYjaXDMWV
```

## API futura

A API do front deve ficar separada do front estatico:

```text
https://apifront.juliaferreiraceo.com.br
```

O formulario do front envia `POST` para:

```text
https://apifront.juliaferreiraceo.com.br/api/leads
```

Variaveis publicas para build no Netlify:

```text
VITE_BACKEND_API_BASE_URL=https://apifront.juliaferreiraceo.com.br
VITE_CHECKOUT_URL=https://pay.hub.la/4d1706OPAXBCYjaXDMWV
VITE_FRONT_SUBMIT_KEY=valor-fornecido-no-env-local
```

Apos resposta `2xx` da API, o front redireciona para `checkout_url` retornado pela API ou para `VITE_CHECKOUT_URL`.

O backend valida o header `x-front-submit-key` contra a variavel server-side `FRONT_SUBMIT_KEY`.

Porta local planejada na VPS:

```text
127.0.0.1:39183
```

CORS deve permitir a origin abaixo. CORS nao valida sub-path, entao qualquer rota dentro desse dominio fica coberta por esta origin:

```text
https://juliaferreiraceo.com.br
```

## Seguranca

Arquivos `.env`, `node_modules`, `dist`, `api` e `infra` nao devem ser enviados ao GitHub.
