# Astro - Notion

Site em Astro com foco em performance, SEO e organização de conteúdo. O projeto combina uma landing page em formato de apresentação, páginas institucionais e um blog estático cuja fonte de conteúdo é sincronizada a partir do Notion.

## O que o projeto faz hoje

- Renderiza uma home com seções em estilo "slides", montadas com componentes reutilizáveis.
- Mantém uma página institucional em formato de artigo.
- Gera um blog estático com `astro:content`.
- Sincroniza posts do Notion para `src/content/blog` antes do build.
- Baixa automaticamente capas e imagens remotas dos posts sincronizados.
- Expõe um endpoint JSON para inspecionar a fonte de dados do Notion.
- Expõe um webhook para acionar novo deploy na Vercel quando houver mudanças no Notion.
- Publica RSS e sitemap.

## Stack

- Astro 6
- TypeScript
- Tailwind CSS 4 via Vite
- `astro:content`
- `astro:assets`
- Notion API
- `notion-to-md`
- Vercel adapter
- RSS e sitemap

## Rotas principais

- `/`: landing page principal
- `/sobre`: página institucional
- `/blog`: listagem de posts publicados
- `/blog/[slug]`: página estática de post
- `/posts.json`: resposta bruta da consulta ao Notion
- `/api/notion-webhook`: webhook para disparar deploy
- `/rss.xml`: feed RSS do blog

## Fluxo de conteúdo

O conteúdo do blog é gerado a partir do Notion por meio do script `scripts/sync-notion.mjs`.

Esse script:

- consulta a data source configurada no Notion;
- converte páginas para Markdown;
- baixa capas e imagens remotas;
- gera frontmatter compatível com `astro:content`;
- recria a pasta `src/content/blog`.

Importante: o comando `npm run build` executa `prebuild`, e o `prebuild` roda `npm run content:sync`. Na prática, isso significa que `src/content/blog` é apagada e regenerada antes de cada build.

## Variáveis de ambiente

Use o arquivo `.env.example` como base:

```env
NOTION_TOKEN=
NOTION_DATA_SOURCE_ID=
SITE_URL=
NOTION_WEBHOOK_VERIFICATION_TOKEN=
VERCEL_DEPLOY_HOOK_URL=
```

### O que cada variável faz

- `NOTION_TOKEN`: token da integração do Notion.
- `NOTION_DATA_SOURCE_ID`: ID da data source usada para buscar os posts.
- `SITE_URL`: URL canônica do site usada pelo Astro.
- `NOTION_WEBHOOK_VERIFICATION_TOKEN`: token usado para validar a assinatura do webhook.
- `VERCEL_DEPLOY_HOOK_URL`: hook chamado quando o webhook recebe eventos relevantes.

## Scripts

```bash
npm install
npm run dev
npm run content:sync
npm run build
npm run preview
```

### Resumo dos scripts

- `npm run dev`: inicia o ambiente local.
- `npm run content:sync`: sincroniza posts do Notion para `src/content/blog`.
- `npm run build`: sincroniza conteúdo e gera o site estático.
- `npm run preview`: serve localmente o build gerado.

## Modelo de post

Os posts renderizados pelo blog seguem o schema definido em `src/content.config.ts`:

- `title`
- `slug`
- `status`
- `author`
- `tags`
- `pubDate`
- `updatedDate`
- `cover`
- `coverAlt`

Somente posts com `status` igual a `Publicado` aparecem na listagem e têm página gerada.

## Estrutura resumida

```text
.
├── public/
│   ├── favicon.ico
│   ├── favicon.svg
│   └── fonts/
├── scripts/
│   └── sync-notion.mjs
└── src/
    ├── assets/
    ├── components/
    │   ├── patterns/
    │   └── primitives/
    ├── config/
    ├── content/
    │   ├── blog/
    │   └── data/home/
    ├── layouts/
    ├── pages/
    │   ├── api/
    │   └── blog/
    └── styles/
```

## Organização da interface

- `src/pages/index.astro`: monta a landing page usando os dados de `src/content/data/home/slides.data.json`.
- `src/layouts/Layout.astro`: layout base do site.
- `src/layouts/PostLayout.astro`: layout das páginas de conteúdo e posts.
- `src/components/patterns/`: componentes de interface como `Slide`, `Box`, `Accordion`, `Header` e `Footer`.

## Deploy

O projeto está configurado com `@astrojs/vercel` e `output: "static"`. O webhook em `/api/notion-webhook` foi pensado para receber eventos do Notion e acionar um novo deploy na Vercel.

## Observações importantes

- O blog não consome o Notion em tempo real no frontend; ele é gerado estaticamente a partir da sincronização.
- O endpoint `/posts.json` serve como utilitário de inspeção da resposta do Notion.
- Se você mantiver posts manuais dentro de `src/content/blog`, eles podem ser sobrescritos pelo processo de sync.
