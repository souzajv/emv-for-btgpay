# HUB EMV BtgPay

Capacitação interna EMV para o time mobile Flutter — trilhas, material e quiz.

## Estrutura

```
emv-for-btgpay/
├── hub/           # Next.js 15 static export
├── pipeline/      # Scraping + PDF ingest (custo zero)
├── content/       # chunks, tracks, quizzes (gerados + seed)
├── pdfs/          # Documentos EMVCo oficiais
└── landingpage-Template/  # Referência visual (não alterar)
```

## Quick start

```bash
# 1. Pipeline de conteúdo (opcional — seed já incluso)
cd pipeline
npm install
npx playwright install chromium
npm run ingest-pdfs
node generate-quizzes.mjs

# 2. HUB
cd ../hub
npm install
npm run dev
```

Build estático: `npm run build` → pasta `out/`

## Deploy na Vercel

Repositório: [github.com/souzajv/emv-for-btgpay](https://github.com/souzajv/emv-for-btgpay)

1. No [dashboard Vercel](https://vercel.com/new), importe o repo `souzajv/emv-for-btgpay`.
2. **Root Directory:** `hub`
3. Framework: Next.js (detectado automaticamente)
4. Build: `npm run build` · Output: `out`
5. Deploy — sem variáveis de ambiente obrigatórias.

O `content/` na raiz do repo é lido em **build time** (`../content` a partir de `hub/`). Após alterar chunks/trilhas/quizzes, rode `npm run build` no hub e faça redeploy.

`metadataBase` usa `VERCEL_URL` automaticamente em produção.

Deploy via CLI (opcional, a partir de `hub/`):

```bash
npx vercel deploy --prod
```

## Quiz

- 3 níveis: junior, pleno, senior
- 50 perguntas/nível, 10 por sessão
- Sem repetição até completar o ciclo (localStorage)

## Agentes Cursor

- `/emv-hub` — orquestração completa
- `emv-content-scraper`, `emv-design-system`, `emv-curriculum-builder`, `emv-quiz-author`

## Fontes

EMVCo, Stripe, PayFelix e PDFs em `pdfs/`. Ver página `/sobre` no hub.
