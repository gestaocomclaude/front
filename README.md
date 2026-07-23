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
- `/imersao-empresa-com-claude-v2/`
- `/imersao-empresa-com-claude-v3/`
- `/imersao-empresa-com-claude-v4/`
- `/imersao-empresa-com-claude-v5/`
- `/rotina-anti-caos/`
- `/assistir/:slug/`

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

Os padroes e URLs prontas de UTM ficam em [`docs/utm-links.md`](docs/utm-links.md).

O roteamento das paginas finais v1/v2/v3/v4/v5 fica documentado em
[`docs/research/final-variants-routing.md`](docs/research/final-variants-routing.md).

## Checkout

Configure a URL de checkout no provedor de deploy usando `VITE_CHECKOUT_URL`.

## API

A API do front deve ficar separada do front estatico:

Configure a URL publica da API no provedor de deploy usando `VITE_BACKEND_API_BASE_URL`.

O formulario do front envia `POST` para:

```text
${VITE_BACKEND_API_BASE_URL}/api/leads
```

O mesmo fluxo faz upsert do lead por e-mail e registra eventos de sessao em `ecc.lead_events`.
A API ainda aceita `instagram_handle`, mas os modais das variantes finais novas nao solicitam mais esse campo.

A ferramenta `/rotina-anti-caos/` envia respostas estruturadas para:

```text
${VITE_BACKEND_API_BASE_URL}/api/rotina-anti-caos
```

As rotas finais distribuidas pelo roteador `/imersao-empresa-com-claude-v1/` registram visualizacoes em:

```text
${VITE_BACKEND_API_BASE_URL}/api/page-views
```

Esses eventos sao gravados no Supabase em `ecc.page_views`.

## Video Links

A rota publica dinamica de videos e:

```text
/assistir/:slug/
```

O front carrega a configuracao pelo endpoint:

```text
${VITE_BACKEND_API_BASE_URL}/api/video-pages/:slug
```

O video fica em formato vertical, pre-carrega antes do clique, usa o primeiro frame como capa turva e libera o CTA final apenas apos o evento `ended`.
O texto do botao inicial vem de `ecc.video_pages.play_button_label`, com fallback `clique para assistir`.
Videos HLS usam `ecc.video_pages.stream_url` e `video_type=hls`; o front usa `hls.js` quando o navegador nao suporta `.m3u8` nativamente.

Eventos e metricas sao registrados desde a primeira versao:

```text
${VITE_BACKEND_API_BASE_URL}/api/video-events
${VITE_BACKEND_API_BASE_URL}/api/video-metrics/:slug
```

Tabelas no Supabase online, schema `ecc`:

```text
video_pages
video_events
video_sessions
```

Storage de arquivos de video:

```text
https://bd.trilhadogpt.com
bucket: video-pages
```

Nao ha upload de capa/poster separado.
O painel do CRM deve permitir selecionar video ja existente no bucket, evitando novo upload quando o arquivo ja estiver carregado.

Pipeline HLS local da VPS:

```text
/opt/front-julia/video-streaming/scripts/process-hls.sh
/opt/front-julia/video-streaming/incoming
/opt/front-julia/video-streaming/library
```

URL publica de HLS:

```text
https://apifront.juliaferreiraceo.com.br/hls/<slug>/master.m3u8
```

O script HLS gera segmentos de 2 segundos. O endpoint `GET /api/video-pages/:slug` e cacheavel por 5 minutos para reduzir latencia em acessos repetidos.

O prompt para construir o painel no projeto do CRM esta em:

```text
docs/crm-video-panel-prompt.md
```

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
