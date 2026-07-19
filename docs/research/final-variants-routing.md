# Roteamento das paginas finais

## Rotas

- `/imersao-empresa-com-claude-v1/`: roteador de variantes.
- `/imersao-empresa-com-claude-v2/`: pagina final v1 antiga, preservada como v2.
- `/imersao-empresa-com-claude-v3/`: mesmo texto da v2, visual inspirado em `https://uniagil.com/claude-project`.
- `/imersao-empresa-com-claude-v4/`: mesmo texto da v2, nova variante visual inspirada em `https://workshop.emarcosmachado.com/workshop-3`.
- `/imersao-empresa-com-claude-v5/`: mesmo texto da v2, variante workshop anterior, antes publicada como v4.

## Regra do roteador v1

Ao acessar `/imersao-empresa-com-claude-v1/`, o script escolhe uma variante entre `v2`, `v3`, `v4` e `v5`.

- A variante fica persistida em `localStorage` na chave `ecc_imersao_final_variant` e tambem em cookie de mesmo nome com validade de 180 dias.
- Quando a pessoa volta no mesmo navegador, o roteador reutiliza a variante persistida antes de sortear uma nova.
- A query string original e preservada para manter UTMs, `fbclid`, `gclid` e outros parametros.
- O roteador adiciona `routed_from=v1`, `variant=v2|v3|v4|v5` e `variant_source=requested|localStorage|cookie|random`.
- E possivel forcar uma variante usando `?variant=v3`, por exemplo.
- A persistencia e local ao navegador/dispositivo. Reidentificacao entre dispositivos ou apos limpeza de dados exige resolver a variante no backend por uma chave do lead, como e-mail ou telefone, antes do redirecionamento.

## Tracking

O front dispara page view para:

```text
/imersao-empresa-com-claude-v2/
/imersao-empresa-com-claude-v3/
/imersao-empresa-com-claude-v4/
/imersao-empresa-com-claude-v5/
```

O roteador `/v1/` nao deve contar como visualizacao da landing final, para nao inflar a taxa de conversao.

## Referencias visuais

### V3

- Referencia: `https://uniagil.com/claude-project`
- Artefatos:
  - `docs/design-references/uniagil-claude-project/desktop.png`
  - `docs/design-references/uniagil-claude-project/mobile.png`
  - `docs/research/uniagil-claude-project/scrapling.md`
  - `docs/research/uniagil-claude-project/playwright-extract.json`
- Direcao visual: fundo creme claro, paleta marrom/laranja/verde, cards brancos, CTA verde arredondado e hero mais limpo.

### V4

- Referencia: `https://workshop.emarcosmachado.com/workshop-3`
- Artefatos:
  - `docs/research/emarcos-workshop-3/scrapling-latest.md`
- Direcao visual: variante workshop com topo escuro, contador ate `2026-07-21T00:00:00-03:00`, hero escuro, CTA laranja e carrossel de depoimentos full-bleed.

### V5

- Referencia: `https://workshop.emarcosmachado.com/workshop-3`
- Artefatos:
  - `docs/design-references/emarcos-workshop-3/desktop.png`
  - `docs/design-references/emarcos-workshop-3/mobile.png`
  - `docs/research/emarcos-workshop-3/scrapling.md`
  - `docs/research/emarcos-workshop-3/playwright-extract.json`
- Direcao visual: estetica editorial premium com `Newsreader`, fundo `#FAFAF7`, cards `#FFFFFF`, texto `#191919/#5C5C5C`, acento `#D97757/#C8623F` e bordas `#E8E6E0`.
