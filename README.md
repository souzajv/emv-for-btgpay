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

## Quiz

- 3 níveis: junior, pleno, senior
- 50 perguntas/nível, 10 por sessão
- Sem repetição até completar o ciclo (localStorage)

## Agentes Cursor

- `/emv-hub` — orquestração completa
- `emv-content-scraper`, `emv-design-system`, `emv-curriculum-builder`, `emv-quiz-author`

## Fontes

EMVCo, Stripe, PayFelix e PDFs em `pdfs/`. Ver página `/sobre` no hub.
