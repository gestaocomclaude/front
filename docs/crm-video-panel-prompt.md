# Prompt para construir o painel CRM de Video Links

Use este prompt no container/projeto do CRM.

## Contexto
Existe uma pagina publica de videos no front Empresa com Claude:

```text
https://www.juliaferreiraceo.com.br/assistir/:slug/
```

O front publico nao acessa Supabase diretamente. Ele chama a API publica:

```text
https://apifront.juliaferreiraceo.com.br
```

## Skills obrigatorias para o front/painel
Use as skills:

```text
$ui-ux-pro-max
$scrapling-official
$clone-website
```

Aplicacao esperada:

```text
$ui-ux-pro-max
Use para desenhar o painel administrativo, tabelas, filtros, estados vazios, upload, metricas, responsividade e acessibilidade.

$scrapling-official
Use apenas se precisar analisar referencias publicas de interface ou documentacao acessivel, respeitando robots/ToS e sem coletar dados sensiveis.

$clone-website
Use como diretriz para traduzir referencias visuais em componentes proprios; nao copie assets proprietarios de terceiros.
```

## Separacao dos Supabases

Supabase das tabelas e metricas:

```text
https://mbshhppxpbsizndaovti.supabase.co
```

Supabase da VPS apenas para storage dos videos:

```text
https://bd.trilhadogpt.com
```

Nao existe upload de capa. O front publico usa o primeiro frame do video como capa turva ate o clique no play.

## Variaveis sensiveis
No CRM, chaves `service_role`, `DATABASE_URL` e credenciais de storage devem ficar somente no backend/server-side do CRM.

Nunca envie para o navegador:

```text
SUPABASE_SERVICE_ROLE_KEY
DATABASE_URL
SUPABASE_DB_DSN
VIDEO_SUPABASE_SERVICE_ROLE_KEY
```

## Modulo a construir
Crie um modulo no CRM chamado:

```text
Video Links
```

Funcionalidades obrigatorias:

```text
1. Listar paginas de video.
2. Criar nova pagina.
3. Editar pagina existente.
4. Ativar/desativar pagina.
5. Selecionar um video HLS ja processado, sem fazer novo upload/processamento.
6. Selecionar um MP4 ja carregado no storage/entrada, sem fazer novo upload.
7. Fazer upload somente do MP4 vertical quando o arquivo ainda nao existir.
8. Processar MP4 para HLS usando FFmpeg na VPS.
9. Salvar a URL original em `source_video_url` e a URL HLS em `stream_url`.
10. Manter `video_url` preenchido por compatibilidade, preferencialmente com a URL final tocavel.
11. Definir texto do botao inicial em play_button_label.
12. Definir texto do botao final em cta_label.
13. Definir link final em cta_url.
14. Ler e exibir metricas imediatas.
15. Filtrar metricas por data, slug, utm_source e utm_campaign.
```

## Tabelas
As tabelas ficam no schema `ecc`.

### ecc.video_pages
Guarda a configuracao de cada pagina publica.

Campos principais:

```text
id
slug
title
video_url
video_type
source_video_url
stream_url
processing_status
processing_error
processed_at
play_button_label
cta_label
cta_url
is_active
metadata
created_at
updated_at
```

Regras:

```text
slug deve usar apenas letras minusculas, numeros e hifens.
Exemplo valido: recuperacao-carrinho
Exemplo invalido: Recuperação Carrinho!
```

URL publica final:

```text
https://www.juliaferreiraceo.com.br/assistir/recuperacao-carrinho/
```

O campo `play_button_label` deve ter como padrao:

```text
clique para assistir
```

Mas o painel precisa permitir alterar esse texto por pagina.

### ecc.video_events
Guarda o historico detalhado.

Eventos registrados pelo front:

```text
page_view
video_preload_started
play_started
progress_25
progress_50
progress_75
video_completed
cta_revealed
cta_clicked
```

### ecc.video_sessions
Guarda o resumo consolidado por sessao.

Use esta tabela para cards de metricas rapidas:

```text
first_seen_at
last_seen_at
play_started_at
completed_at
cta_revealed_at
cta_clicked_at
max_progress_percent
utm_source
utm_campaign
```

## Metricas obrigatorias na primeira versao
Construa o painel ja mostrando:

```text
Visualizacoes da pagina
Videos pre-carregados
Plays iniciados
25% assistido
50% assistido
75% assistido
Videos concluidos
CTAs revelados
Cliques no CTA
Sessoes unicas
Taxa de conclusao
Taxa de clique apos CTA revelado
Media de progresso assistido
Quebra por utm_source
Quebra por utm_campaign
```

Calculos:

```text
completion_rate = video_completed / play_started
cta_click_rate = cta_clicked / cta_revealed
```

## Endpoints ja planejados no front/API
O painel pode ler direto do banco pelo backend do CRM ou consultar a API quando fizer sentido:

```text
GET /api/video-pages/:slug
POST /api/video-events
GET /api/video-metrics/:slug
```

Para o painel administrativo, prefira leitura server-side pelo backend do CRM quando houver dados sensiveis, filtros avancados ou permissao de usuario.

## Upload do video
O painel deve oferecer duas formas de definir o video:

```text
1. Selecionar HLS ja processado.
2. Selecionar MP4 ja carregado para processar.
3. Enviar novo MP4 quando ainda nao existir.
```

Isso evita fazer um segundo upload quando o video ja estiver disponivel.

## Processamento HLS na VPS

FFmpeg ja esta instalado na VPS do front e existe um script pronto:

```text
/opt/front-julia/video-streaming/scripts/process-hls.sh
```

Uso:

```bash
/opt/front-julia/video-streaming/scripts/process-hls.sh <slug> <arquivo-mp4>
```

Exemplo:

```bash
/opt/front-julia/video-streaming/scripts/process-hls.sh recuperacao-carrinho /opt/front-julia/video-streaming/incoming/recuperacao-carrinho.mp4
```

Saida publica esperada:

```text
https://apifront.juliaferreiraceo.com.br/hls/recuperacao-carrinho/master.m3u8
```

O backend do CRM deve:

```text
1. Validar slug.
2. Salvar ou localizar o MP4 de entrada.
3. Marcar processing_status = 'processing'.
4. Executar o script process-hls.sh de forma server-side.
5. Se sucesso:
   - video_type = 'hls'
   - source_video_url = URL/caminho do MP4 original
   - stream_url = https://apifront.juliaferreiraceo.com.br/hls/<slug>/master.m3u8
   - video_url = mesmo valor de stream_url, por compatibilidade
   - processing_status = 'ready'
   - processing_error = null
   - processed_at = now()
6. Se falhar:
   - processing_status = 'failed'
   - processing_error = mensagem resumida do erro
```

O upload novo, quando necessario, pode ir para a pasta de entrada da VPS:

```text
/opt/front-julia/video-streaming/incoming
```

Ou para o Supabase Storage da VPS:

```text
https://bd.trilhadogpt.com
bucket: video-pages
```

Formato recomendado:

```text
MP4 H.264
vertical 9:16
720x1280 ou 1080x1920
audio AAC
arquivo comprimido
```

Depois do processamento, salve a URL publica HLS em:

```text
ecc.video_pages.stream_url
```

Para compatibilidade, mantenha tambem:

```text
ecc.video_pages.video_url
```

com o mesmo valor de `stream_url`.

## UX do painel
Inclua:

```text
Estado vazio com botao "Criar video link".
Validacao de slug em tempo real.
Preview da URL publica.
Indicador de upload em progresso.
Erro claro se upload falhar.
Campo para escolher video ja existente no storage ou HLS ja processado.
Status visual de processamento: pendente, processando, pronto, falhou.
Mensagem de erro quando `processing_status = failed`.
Botao de copiar URL.
Toggle de ativo/inativo.
Cards de metricas no topo.
Tabela de eventos abaixo.
Filtros por periodo e UTM.
```

## Criterios de aceite

```text
1. Criar pagina ativa no CRM gera uma URL publica funcional sem redeploy.
2. Upload salva somente o video, sem capa.
3. Se o video ja existir no storage ou ja estiver processado em HLS, o painel permite selecionar sem novo upload.
4. MP4 novo pode ser processado para HLS na VPS via FFmpeg.
5. O front publico deve receber `video_type = hls` e `stream_url` quando o processamento estiver pronto.
6. O texto do botao inicial pode ser personalizado por pagina via `play_button_label`.
7. Primeiro frame do video e usado pelo front publico como capa turva.
8. O CTA publico so aparece quando o video termina.
9. Metricas aparecem no painel desde a primeira versao.
10. Nenhuma chave sensivel aparece no bundle do navegador.
```
