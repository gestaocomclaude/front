# Prompt De Adequacao Do CRM Para Bunny Stream

Voce esta no projeto do CRM Empresa com Claude.

## Objetivo

Adequar o painel de Video Links para integrar com Bunny Stream, permitindo:

- Subir um novo video pelo CRM diretamente para a Bunny Stream.
- Listar videos ja existentes na biblioteca Bunny.
- Vincular um video Bunny existente a uma pagina/slug de Video Links.
- Salvar no Supabase as informacoes necessarias para o front publico carregar o video via Bunny.
- Manter segredos apenas no backend/API do CRM, nunca no front.

## Contexto Do Projeto Publico

- Front publico: `/opt/front-julia/empresa-com-claude`
- API publica separada: `/opt/front-julia/api/server.js`
- Supabase principal: schema `ecc`
- Tabela principal de videos: `ecc.video_pages`
- Rota publica de video: `/assistir/:slug/`
- Slug atual de referencia: `claudeslavingia`

O front publico ja suporta:

- `video_type = "mp4"`
- `video_type = "hls"`
- `video_type = "embed"`

Para Bunny, usar:

- `video_type = "embed"`
- `video_url = URL de embed Bunny`
- `stream_url = mesma URL de embed Bunny`
- `source_video_url = URL HLS Bunny, se existir`
- `metadata.bunny` com dados do video

## Variaveis Necessarias No Backend/API Do CRM

Nunca expor no front.

```env
BUNNY_STREAM_LIBRARY_ID=
BUNNY_STREAM_API_KEY=
BUNNY_STREAM_CDN_HOSTNAME=
```

Importante:

- `BUNNY_STREAM_API_KEY` deve ser a Stream API Key da biblioteca Bunny, nao a API Key geral da conta.
- A chave fica em: `Stream > Video Library > API > API Key`.
- Base da Stream API: `https://video.bunnycdn.com`
- Autenticacao: header `AccessKey: BUNNY_STREAM_API_KEY`

## Endpoints Bunny Necessarios

### 1. Listar Videos Existentes

```text
GET https://video.bunnycdn.com/library/{libraryId}/videos?page=1&itemsPerPage=50
```

Header:

```text
AccessKey: {BUNNY_STREAM_API_KEY}
```

### 2. Criar Objeto De Video

```text
POST https://video.bunnycdn.com/library/{libraryId}/videos
```

Headers:

```text
AccessKey: {BUNNY_STREAM_API_KEY}
Accept: application/json
Content-Type: application/json
```

Body:

```json
{
  "title": "nome-do-video"
}
```

A resposta retorna o `guid`/`videoId` do video.

### 3. Upload Binario Do Arquivo

```text
PUT https://video.bunnycdn.com/library/{libraryId}/videos/{videoId}
```

Headers:

```text
AccessKey: {BUNNY_STREAM_API_KEY}
Content-Type: application/octet-stream
```

Body:

```text
arquivo binario bruto, nao base64
```

### 4. Opcional: Fetch Remoto

Caso o video ja esteja publico em outra URL:

```text
POST https://video.bunnycdn.com/library/{libraryId}/videos/fetch
```

Headers:

```text
AccessKey: {BUNNY_STREAM_API_KEY}
Accept: application/json
Content-Type: application/json
```

Body:

```json
{
  "url": "https://url-publica-do-video.mp4"
}
```

## URLs Bunny A Derivar

Dado:

- `libraryId = BUNNY_STREAM_LIBRARY_ID`
- `videoId = guid retornado/listado pela Bunny`
- `cdnHostname = BUNNY_STREAM_CDN_HOSTNAME`

Embed:

```text
https://player.mediadelivery.net/embed/{libraryId}/{videoId}
```

HLS:

```text
https://{cdnHostname}/{videoId}/playlist.m3u8
```

MP4 fallback, se habilitado na Bunny:

```text
https://{cdnHostname}/{videoId}/play_720p.mp4
```

Thumbnail:

```text
https://{cdnHostname}/{videoId}/thumbnail.jpg
```

Atencao:

No ambiente atual, as URLs diretas HLS/MP4 podem retornar `403` dependendo da configuracao da biblioteca Bunny. O embed oficial esta funcionando. Portanto, para o front publico, salve por padrao o embed como `video_url` e `stream_url`.

## Tabela Supabase

Usar schema `ecc` e tabela `video_pages`.

A tabela precisa aceitar:

```text
video_type = "embed"
```

Caso a constraint ainda nao aceite, aplicar:

```sql
alter table ecc.video_pages
  drop constraint if exists video_pages_video_type_chk;

alter table ecc.video_pages
  add constraint video_pages_video_type_chk
  check (video_type in ('mp4', 'hls', 'embed'));
```

## Como Salvar Ao Vincular Video Bunny A Um Slug

Salvar:

```text
video_type = "embed"
video_url = "https://player.mediadelivery.net/embed/{libraryId}/{videoId}"
stream_url = "https://player.mediadelivery.net/embed/{libraryId}/{videoId}"
source_video_url = "https://{cdnHostname}/{videoId}/playlist.m3u8"
processing_status = "ready"
processing_error = null
processed_at = now()
```

`metadata`:

```json
{
  "bunny": {
    "library_id": "{libraryId}",
    "video_id": "{videoId}",
    "title": "{titulo}",
    "cdn_hostname": "{cdnHostname}",
    "embed_url": "https://player.mediadelivery.net/embed/{libraryId}/{videoId}",
    "hls_url": "https://{cdnHostname}/{videoId}/playlist.m3u8",
    "mp4_720_url": "https://{cdnHostname}/{videoId}/play_720p.mp4",
    "thumbnail_url": "https://{cdnHostname}/{videoId}/thumbnail.jpg",
    "status": "{status Bunny}",
    "encode_progress": "{encodeProgress Bunny}"
  }
}
```

## Fluxo Desejado No Painel

### 1. Tela/Listagem De Video Links

Cada pagina deve mostrar:

- slug
- titulo
- status
- tipo de video atual
- origem atual: VPS/HLS/MP4/Bunny
- botao `Vincular Bunny`
- botao `Subir novo video`

### 2. Modal Ou Pagina `Vincular Bunny`

Deve ter:

- busca/listagem dos videos existentes na biblioteca Bunny
- titulo do video
- `guid`/`videoId`
- duracao
- status/processamento
- resolucoes disponiveis
- thumbnail, se disponivel
- botao `Usar este video`

Ao clicar em `Usar este video`:

- atualizar o registro `ecc.video_pages` daquele slug conforme estrutura acima.
- limpar/invalidar cache se existir endpoint de cache no backend.
- mostrar feedback de sucesso.

### 3. Modal Ou Pagina `Subir Novo Video`

Deve ter:

- input de arquivo de video
- campo titulo
- barra de progresso do upload
- status de processamento
- apos upload, salvar ou permitir vincular ao slug

## Fluxo De Upload

1. Backend recebe arquivo do CRM.
2. Backend cria objeto na Bunny:
   `POST /library/{libraryId}/videos`
3. Backend envia binario:
   `PUT /library/{libraryId}/videos/{videoId}`
4. Backend consulta o video periodicamente ate status/`encodeProgress` indicar pronto.
5. Backend salva no Supabase vinculado ao slug, se o usuario ja estiver subindo para uma pagina especifica.
6. Caso contrario, deixa o video disponivel na listagem para vincular depois.

## Importante Sobre O Frontend Do CRM

- O front do CRM nunca deve chamar a Bunny diretamente.
- O front do CRM chama apenas endpoints internos do proprio backend do CRM.
- O backend do CRM e quem usa `BUNNY_STREAM_API_KEY`.

## Endpoints Internos Sugeridos Para O CRM

```text
GET /api/admin/bunny/videos
```

Lista videos da Bunny.

```text
POST /api/admin/bunny/videos
```

Cria video na Bunny e faz upload. Pode usar `multipart/form-data`.

```text
POST /api/admin/video-pages/:slug/bunny-link
```

Vincula um video Bunny existente ao slug.

Body:

```json
{
  "video_id": "...",
  "title": "..."
}
```

```text
GET /api/admin/video-pages/:slug
```

Retorna detalhes do slug.

## Requisitos De UX

- Mostrar claramente se o video ainda esta processando.
- Nao permitir vincular como pronto se `encodeProgress` nao estiver `100` ou status nao indicar pronto.
- Permitir atualizar status manualmente.
- Permitir selecionar video existente sem novo upload.
- Mostrar erro `401` da Bunny como `API Key invalida ou nao e a Stream API Key da biblioteca`.
- Mostrar erro `403` em URLs diretas como `biblioteca nao permite acesso direto; usando embed Bunny`.

## Requisitos Tecnicos

- Nao commitar `.env`.
- Nao imprimir secrets em logs.
- Validar tamanho/tipo de arquivo.
- Usar streaming/multipart de forma segura.
- Evitar carregar o arquivo inteiro em memoria se possivel.
- Registrar logs operacionais sem expor chave.
- Preservar metricas existentes em `ecc.video_events` e `ecc.video_sessions`.
- Manter compatibilidade com os tipos atuais `mp4`/`hls`/`embed`.

## Observacao Importante

O front publico ja foi ajustado para usar Bunny embed quando `video_type = "embed"`.

O iframe Bunny fica sem interacao direta no front publico, usando nosso botao externo para iniciar e Player.js para capturar progresso/finalizacao.
