# Links UTM - Empresa com Claude

Este documento guarda os padroes de UTMs para a rota principal:

```text
https://www.juliaferreiraceo.com.br/imersao-empresa-com-claude-v1/
```

## Regras gerais

- Use UTMs em todo link distribuido fora do site.
- `first_utm_*` no Supabase preserva a primeira origem do lead.
- `last_utm_*` no Supabase mostra a ultima origem/interacao antes do novo envio/conversao.
- Para recuperacao de carrinho, use uma campanha propria para separar reengajamento da captacao original.

## Parametros padrao

```text
utm_source=canal
utm_medium=tipo_de_trafego
utm_campaign=campanha
utm_content=criativo_ou_mensagem
utm_term=segmento_ou_contexto
```

## Recuperacao de carrinho - WhatsApp

Padrao recomendado:

```text
utm_source=whatsapp
utm_medium=recovery
utm_campaign=carrinho_abandonado_imersao_claude
utm_content=mensagem_01
utm_term=checkout_abandonado
```

URL principal:

```text
https://www.juliaferreiraceo.com.br/imersao-empresa-com-claude-v1/?utm_source=whatsapp&utm_medium=recovery&utm_campaign=carrinho_abandonado_imersao_claude&utm_content=mensagem_01&utm_term=checkout_abandonado
```

Variacoes por mensagem:

```text
https://www.juliaferreiraceo.com.br/imersao-empresa-com-claude-v1/?utm_source=whatsapp&utm_medium=recovery&utm_campaign=carrinho_abandonado_imersao_claude&utm_content=mensagem_02&utm_term=checkout_abandonado
```

```text
https://www.juliaferreiraceo.com.br/imersao-empresa-com-claude-v1/?utm_source=whatsapp&utm_medium=recovery&utm_campaign=carrinho_abandonado_imersao_claude&utm_content=audio_julia&utm_term=checkout_abandonado
```

```text
https://www.juliaferreiraceo.com.br/imersao-empresa-com-claude-v1/?utm_source=whatsapp&utm_medium=recovery&utm_campaign=carrinho_abandonado_imersao_claude&utm_content=prova_social&utm_term=checkout_abandonado
```

```text
https://www.juliaferreiraceo.com.br/imersao-empresa-com-claude-v1/?utm_source=whatsapp&utm_medium=recovery&utm_campaign=carrinho_abandonado_imersao_claude&utm_content=ultimo_aviso&utm_term=checkout_abandonado
```

Variacoes por contexto:

```text
utm_term=lead_sem_checkout
utm_term=checkout_abandonado
utm_term=boleto_nao_pago
utm_term=pix_expirado
```

## Instagram organico

Bio:

```text
https://www.juliaferreiraceo.com.br/imersao-empresa-com-claude-v1/?utm_source=instagram&utm_medium=bio&utm_campaign=imersao_claude_lote_zero
```

Stories:

```text
https://www.juliaferreiraceo.com.br/imersao-empresa-com-claude-v1/?utm_source=instagram&utm_medium=stories&utm_campaign=imersao_claude_lote_zero
```

Reels:

```text
https://www.juliaferreiraceo.com.br/imersao-empresa-com-claude-v1/?utm_source=instagram&utm_medium=reels&utm_campaign=imersao_claude_lote_zero&utm_content=reels_01
```

## Anuncios Meta

Use parametros dinamicos no anuncio quando possivel:

```text
utm_source=meta&utm_medium=paid_social&utm_campaign={{campaign.name}}&utm_content={{ad.name}}&utm_term={{adset.name}}&campaign_id={{campaign.id}}&adset_id={{adset.id}}&ad_id={{ad.id}}
```

URL com parametros dinamicos:

```text
https://www.juliaferreiraceo.com.br/imersao-empresa-com-claude-v1/?utm_source=meta&utm_medium=paid_social&utm_campaign={{campaign.name}}&utm_content={{ad.name}}&utm_term={{adset.name}}&campaign_id={{campaign.id}}&adset_id={{adset.id}}&ad_id={{ad.id}}
```

Fallback manual:

```text
https://www.juliaferreiraceo.com.br/imersao-empresa-com-claude-v1/?utm_source=meta&utm_medium=paid_social&utm_campaign=imersao_claude_lote_zero&utm_content=criativo_01&utm_term=publico_frio
```

## Conteudos sugeridos para `utm_content`

```text
mensagem_01
mensagem_02
audio_julia
prova_social
ultimo_aviso
criativo_01
criativo_02
video_julia
depoimento
reels_01
story_01
```

## Termos sugeridos para `utm_term`

```text
lead_sem_checkout
checkout_abandonado
boleto_nao_pago
pix_expirado
publico_frio
remarketing
lookalike
compradoras_antigas
```
