# Astro Boy

Projeto em Astro focado em demonstrar performance, SEO e organização de conteúdo com uma home em formato de slides, blog local em Markdown e blog integrado ao Notion como CMS headless.

## Visão geral

O projeto reúne três frentes principais:

- landing page institucional com seções em formato de apresentação;
- blog local usando `astro:content`;
- blog dinâmico com Notion, incluindo cache de assets, rotas de mídia e webhook para invalidação/atualização.

## Stack

- Astro 6
- TypeScript
- Tailwind CSS 4 via Vite
- MDX
- `astro:content`
- Notion API (`@notionhq/client`)
- RSS e Sitemap
- Adapter da Vercel

## Funcionalidades

- Home baseada em componentes reutilizáveis e conteúdo desacoplado em JSON.
- Blog local com posts em Markdown e rotas dinâmicas por slug.
- Integração com Notion para listar e renderizar posts publicados.
- Cache local de capas e imagens vindas do Notion.
- Webhook para invalidar cache e aquecer conteúdo após mudanças no Notion.
- Feed RSS para o blog local.
- SEO básico com metatags, canonical e Open Graph.

## Rotas principais

- `/`: página inicial com a apresentação sobre Astro.
- `/sobre`: página institucional em layout de post.
- `/blog`: listagem do blog local.
- `/blog/[slug]`: post do blog local.
- `/blog-notion`: listagem de posts do Notion.
- `/blog-notion/[slug]`: post renderizado a partir do Notion.
- `/rss.xml`: feed RSS do blog local.
- `/api/notion-webhook`: endpoint para atualização de cache via webhook do Notion.
- `/media/notion/cover/[pageId]`: entrega de capas processadas do Notion.
- `/media/notion/block/[pageId]/[blockId]`: entrega de assets de blocos do Notion.

## Conteúdo e arquitetura

### Home

A home consome os dados de `src/content/data/home/slides.data.json` e distribui o conteúdo em componentes como `Slide`, `Box` e `Accordion`.

### Blog local

Os posts ficam em `src/content/blog` e são validados pelo schema definido em `src/content.config.ts`.

### Notion CMS

A integração com Notion fica centralizada em `src/lib/notion`, cobrindo:

- consulta e transformação de posts;
- renderização de blocos;
- gerenciamento de cache;
- download e derivação de imagens;
- limpeza e reaquecimento de conteúdo.

## Scripts

```bash
npm install
npm run dev
npm run build
npm run preview
```

## Variáveis de ambiente

Crie um `.env` com:

```env
NOTION_TOKEN=
NOTION_DATA_SOURCE_ID=
NOTION_WEBHOOK_SECRET=
```

## Estrutura de pastas

```text
Astro-Boy/
├── public/
│   └── fonts/
├── cache/
│   └── notion/
│       └── assets/
│           ├── block/
│           │   ├── derived/
│           │   └── original/
│           └── cover/
│               ├── derived/
│               └── original/
└── src/
    ├── assets/
    ├── components/
    │   ├── Accordion/
    │   ├── Box/
    │   └── notion/
    ├── config/
    ├── content/
    │   ├── blog/
    │   └── data/
    │       └── home/
    ├── layouts/
    ├── lib/
    │   └── notion/
    ├── pages/
    │   ├── api/
    │   ├── blog/
    │   ├── blog-notion/
    │   └── media/
    │       └── notion/
    │           ├── block/
    │           │   └── [pageId]/
    │           └── cover/
    └── styles/
```

## Observações

- A URL configurada no Astro está em `https://astro-boy.vercel.app`.
- O layout base está em `src/layouts/Layout.astro`.
- O layout de posts está em `src/layouts/PostLayout.astro`.
- A navegação principal expõe `Sobre`, `Blog` e `Notion`.
- Pastas geradas como `.astro`, `dist`, `.vercel` e `node_modules` foram omitidas da árvore por não fazerem parte da estrutura-fonte do projeto.
